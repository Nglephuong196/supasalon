using Api.Interfaces;
using Api.Models;
using Api.Utils;

namespace Api.Endpoints;

public static class InvoiceEndpoints
{
    public static IEndpointRouteBuilder MapInvoiceEndpoints(this IEndpointRouteBuilder app)
    {
        var invoices = app.MapGroup("/api/invoices").RequireAuthorization();

        invoices.MapGet("/", GetInvoices);
        invoices.MapPost("/", CreateInvoice);
        invoices.MapPost("/{invoiceId:int}/payments", RecordPayment);

        return app;
    }

    private static async Task<IResult> GetInvoices(
        bool? isOpenInTab,
        DateTime? from,
        DateTime? to,
        int? branchId,
        int? page,
        int? limit,
        HttpContext httpContext,
        IInvoiceService service,
        CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid)
        {
            return validation.Error!;
        }

        var organizationId = validation.OrganizationId!;
        var utcFrom = UtcDateTime.EnsureUtc(from);
        var utcTo = UtcDateTime.EnsureUtc(to);
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        var effectiveBranchId = resolvedBranchId ?? branchId;
        var query = new InvoiceListQuery(
            IsOpenInTab: isOpenInTab,
            From: utcFrom,
            To: utcTo,
            BranchId: effectiveBranchId,
            Page: PaginationDefaults.Page(page),
            Limit: PaginationDefaults.Limit(limit));
        var data = await service.GetPagedAsync(organizationId, query, ct);

        return Results.Ok(data);
    }

    private static async Task<IResult> CreateInvoice(
        CreateInvoiceRequest request,
        HttpContext httpContext,
        IInvoiceService service,
        CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid)
        {
            return validation.Error!;
        }

        var organizationId = validation.OrganizationId!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        if (resolvedBranchId is int branchId)
        {
            if (request.BranchId is int requestedBranchId && requestedBranchId != branchId)
            {
                return Results.BadRequest(new { message = "branchId mismatch between header and request payload." });
            }

            request = request with { BranchId = branchId };
        }
        try
        {
            var invoice = await service.CreateAsync(organizationId, request, ct);
            return Results.Created($"/api/invoices/{invoice.Id}", invoice);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
    }

    private static async Task<IResult> RecordPayment(
        int invoiceId,
        RecordInvoicePaymentRequest request,
        HttpContext httpContext,
        IInvoicePaymentService service,
        CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid)
        {
            return validation.Error!;
        }

        var organizationId = validation.OrganizationId!;
        try
        {
            var invoice = await service.RecordPaymentAsync(organizationId, invoiceId, request, ct);
            return Results.Ok(invoice);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
    }
}
