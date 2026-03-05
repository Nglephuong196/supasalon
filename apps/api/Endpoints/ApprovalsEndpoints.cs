using Api.Data;
using Api.Models;
using Api.Utils;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class ApprovalsEndpoints
{
    public static IEndpointRouteBuilder MapApprovalsEndpoints(this IEndpointRouteBuilder app)
    {
        var approvals = app.MapGroup("/api/approval-requests").RequireAuthorization();

        approvals.MapGet("/policy", GetPolicy);
        approvals.MapPut("/policy", UpdatePolicy);

        approvals.MapGet("/", ListRequests);
        approvals.MapPatch("/{id:int}/approve", Approve);
        approvals.MapPatch("/{id:int}/reject", Reject);

        return app;
    }

    private sealed record PolicyPayload(bool? RequireInvoiceCancelApproval, bool? RequireInvoiceRefundApproval, double? InvoiceRefundThreshold, bool? RequireCashOutApproval, double? CashOutThreshold);
    private sealed record ReviewPayload(string? ReviewReason);

    private static async Task<IResult> GetPolicy(HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var orgId = validation.OrganizationId!;
        var entity = await db.ApprovalPolicies.AsNoTracking().FirstOrDefaultAsync(x => x.OrganizationId == orgId, ct);
        if (entity is null)
        {
            return Results.Ok(new
            {
                id = 0,
                organizationId = orgId,
                requireInvoiceCancelApproval = false,
                requireInvoiceRefundApproval = false,
                invoiceRefundThreshold = 0,
                requireCashOutApproval = false,
                cashOutThreshold = 0,
                createdAt = DateTime.UtcNow,
                updatedAt = DateTime.UtcNow
            });
        }

        return Results.Ok(MapPolicy(entity));
    }

    private static async Task<IResult> UpdatePolicy(PolicyPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var orgId = validation.OrganizationId!;
        var entity = await db.ApprovalPolicies.FirstOrDefaultAsync(x => x.OrganizationId == orgId, ct);

        if (entity is null)
        {
            entity = new ApprovalPolicy
            {
                OrganizationId = orgId,
                RequireInvoiceCancelApproval = payload.RequireInvoiceCancelApproval ?? false,
                RequireInvoiceRefundApproval = payload.RequireInvoiceRefundApproval ?? false,
                InvoiceRefundThreshold = payload.InvoiceRefundThreshold ?? 0,
                RequireCashOutApproval = payload.RequireCashOutApproval ?? false,
                CashOutThreshold = payload.CashOutThreshold ?? 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.ApprovalPolicies.Add(entity);
        }
        else
        {
            entity.RequireInvoiceCancelApproval = payload.RequireInvoiceCancelApproval ?? entity.RequireInvoiceCancelApproval;
            entity.RequireInvoiceRefundApproval = payload.RequireInvoiceRefundApproval ?? entity.RequireInvoiceRefundApproval;
            entity.InvoiceRefundThreshold = payload.InvoiceRefundThreshold ?? entity.InvoiceRefundThreshold;
            entity.RequireCashOutApproval = payload.RequireCashOutApproval ?? entity.RequireCashOutApproval;
            entity.CashOutThreshold = payload.CashOutThreshold ?? entity.CashOutThreshold;
            entity.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Results.Ok(MapPolicy(entity));
    }

    private static async Task<IResult> ListRequests(HttpContext httpContext, string? status, string? entityType, DateTime? from, DateTime? to, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var utcFrom = UtcDateTime.EnsureUtc(from);
        var utcTo = UtcDateTime.EnsureUtc(to);

        var query = db.ApprovalRequests.AsNoTracking().Where(x => x.OrganizationId == validation.OrganizationId);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
        if (!string.IsNullOrWhiteSpace(entityType)) query = query.Where(x => x.EntityType == entityType);
        if (utcFrom is DateTime f) query = query.Where(x => x.CreatedAt >= f);
        if (utcTo is DateTime t) query = query.Where(x => x.CreatedAt <= t);

        var rows = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        return Results.Ok(rows.Select(MapRequest));
    }

    private static async Task<IResult> Approve(int id, ReviewPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.ApprovalRequests.FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);
        if (entity is null) return Results.NotFound(new { message = "Approval request not found" });

        entity.Status = "approved";
        entity.ReviewReason = payload.ReviewReason ?? entity.ReviewReason;
        entity.ReviewedAt = DateTime.UtcNow;
        entity.ExecutedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Results.Ok(new
        {
            approved = MapRequest(entity),
            executionResult = (object?)null
        });
    }

    private static async Task<IResult> Reject(int id, ReviewPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.ApprovalRequests.FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);
        if (entity is null) return Results.NotFound(new { message = "Approval request not found" });

        entity.Status = "rejected";
        entity.ReviewReason = payload.ReviewReason ?? entity.ReviewReason;
        entity.ReviewedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Results.Ok(MapRequest(entity));
    }

    private static object MapPolicy(ApprovalPolicy p) => new
    {
        id = p.Id,
        organizationId = p.OrganizationId,
        requireInvoiceCancelApproval = p.RequireInvoiceCancelApproval,
        requireInvoiceRefundApproval = p.RequireInvoiceRefundApproval,
        invoiceRefundThreshold = p.InvoiceRefundThreshold,
        requireCashOutApproval = p.RequireCashOutApproval,
        cashOutThreshold = p.CashOutThreshold,
        createdAt = p.CreatedAt,
        updatedAt = p.UpdatedAt
    };

    private static object MapRequest(ApprovalRequest r) => new
    {
        id = r.Id,
        organizationId = r.OrganizationId,
        entityType = r.EntityType,
        entityId = r.EntityId,
        action = r.Action,
        payload = r.Payload,
        status = r.Status,
        requestReason = r.RequestReason,
        reviewReason = r.ReviewReason,
        requestedByUserId = r.RequestedByUserId,
        reviewedByUserId = r.ReviewedByUserId,
        reviewedAt = r.ReviewedAt,
        executedAt = r.ExecutedAt,
        createdAt = r.CreatedAt,
        requestedBy = (object?)null,
        reviewedBy = (object?)null
    };
}
