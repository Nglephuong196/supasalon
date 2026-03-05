using Api.Data;
using Api.Models;
using Api.Utils;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class SettingsEndpoints
{
    public static IEndpointRouteBuilder MapSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var settings = app.MapGroup("/api").RequireAuthorization();

        settings.MapGet("/membership-tiers", ListMembershipTiers);
        settings.MapPost("/membership-tiers", CreateMembershipTier);
        settings.MapPut("/membership-tiers/{id:int}", UpdateMembershipTier);
        settings.MapDelete("/membership-tiers/{id:int}", DeleteMembershipTier);

        settings.MapGet("/booking-policies", GetBookingPolicy);
        settings.MapPut("/booking-policies", UpsertBookingPolicy);
        settings.MapGet("/staff-commission-rules", ListCommissionRules);
        settings.MapPost("/staff-commission-rules/upsert", UpsertCommissionRule);
        settings.MapPost("/staff-commission-rules/bulk-upsert", BulkUpsertCommissionRules);
        settings.MapDelete("/staff-commission-rules/{id:int}", DeleteCommissionRule);
        settings.MapPost("/commission-payouts/preview", PreviewCommissionPayouts);
        settings.MapPost("/commission-payouts", CreateCommissionPayouts);
        settings.MapGet("/commission-payouts", ListCommissionPayouts);
        settings.MapPatch("/commission-payouts/{id:int}/pay", MarkCommissionPayoutPaid);

        return app;
    }

    private sealed record MembershipTierPayload(
        string? Name,
        double? MinSpending,
        double? DiscountPercent,
        double? MinSpendingToMaintain,
        int? SortOrder);

    private sealed record BookingPolicyPayload(
        bool? PreventStaffOverlap,
        int? BufferMinutes,
        bool? RequireDeposit,
        double? DefaultDepositAmount,
        int? CancellationWindowHours);
    private sealed record CommissionRulePayload(
        string StaffId,
        string ItemType,
        int ItemId,
        string CommissionType,
        double CommissionValue);
    private sealed record BulkCommissionRulesPayload(List<CommissionRulePayload> Rules);
    private sealed record CommissionPayoutRangePayload(string From, string To);
    private sealed record CommissionPayoutCreatePayload(string From, string To, string? Notes);

    private static async Task<IResult> ListMembershipTiers(HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var data = await db.MembershipTiers
            .AsNoTracking()
            .Where(x => x.OrganizationId == validation.OrganizationId)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Id)
            .Select(x => new
            {
                id = x.Id,
                name = x.Name,
                minSpending = x.MinSpending,
                discountPercent = x.DiscountPercent,
                minSpendingToMaintain = x.MinSpendingToMaintain,
                sortOrder = x.SortOrder
            })
            .ToListAsync(ct);

        return Results.Ok(data);
    }

    private static async Task<IResult> CreateMembershipTier(MembershipTierPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        if (string.IsNullOrWhiteSpace(payload.Name))
        {
            return Results.BadRequest(new { message = "Name is required" });
        }
        if (payload.MinSpending is null || payload.DiscountPercent is null || payload.SortOrder is null)
        {
            return Results.BadRequest(new { message = "minSpending, discountPercent and sortOrder are required" });
        }

        var entity = new MembershipTier
        {
            OrganizationId = validation.OrganizationId!,
            Name = payload.Name,
            MinSpending = payload.MinSpending.Value,
            DiscountPercent = payload.DiscountPercent.Value,
            MinSpendingToMaintain = payload.MinSpendingToMaintain,
            SortOrder = payload.SortOrder.Value,
            CreatedAt = DateTime.UtcNow
        };

        db.MembershipTiers.Add(entity);
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/membership-tiers/{entity.Id}", new
        {
            id = entity.Id,
            name = entity.Name,
            minSpending = entity.MinSpending,
            discountPercent = entity.DiscountPercent,
            minSpendingToMaintain = entity.MinSpendingToMaintain,
            sortOrder = entity.SortOrder
        });
    }

    private static async Task<IResult> UpdateMembershipTier(int id, MembershipTierPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.MembershipTiers
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);

        if (entity is null) return Results.NotFound(new { message = "Membership tier not found" });

        entity.Name = payload.Name ?? entity.Name;
        entity.MinSpending = payload.MinSpending ?? entity.MinSpending;
        entity.DiscountPercent = payload.DiscountPercent ?? entity.DiscountPercent;
        entity.MinSpendingToMaintain = payload.MinSpendingToMaintain ?? entity.MinSpendingToMaintain;
        entity.SortOrder = payload.SortOrder ?? entity.SortOrder;

        await db.SaveChangesAsync(ct);

        return Results.Ok(new
        {
            id = entity.Id,
            name = entity.Name,
            minSpending = entity.MinSpending,
            discountPercent = entity.DiscountPercent,
            minSpendingToMaintain = entity.MinSpendingToMaintain,
            sortOrder = entity.SortOrder
        });
    }

    private static async Task<IResult> DeleteMembershipTier(int id, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.MembershipTiers
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);

        if (entity is null) return Results.NotFound(new { message = "Membership tier not found" });

        db.MembershipTiers.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { message = "Deleted" });
    }

    private static async Task<IResult> GetBookingPolicy(HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var orgId = validation.OrganizationId!;
        var policy = await db.BookingPolicies
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationId == orgId, ct);

        if (policy is null)
        {
            return Results.Ok(new
            {
                id = 0,
                organizationId = orgId,
                preventStaffOverlap = true,
                bufferMinutes = 0,
                requireDeposit = false,
                defaultDepositAmount = 0,
                cancellationWindowHours = 24,
                createdAt = DateTime.UtcNow,
                updatedAt = DateTime.UtcNow
            });
        }

        return Results.Ok(new
        {
            id = policy.Id,
            organizationId = policy.OrganizationId,
            preventStaffOverlap = policy.PreventStaffOverlap,
            bufferMinutes = policy.BufferMinutes,
            requireDeposit = policy.RequireDeposit,
            defaultDepositAmount = policy.DefaultDepositAmount,
            cancellationWindowHours = policy.CancellationWindowHours,
            createdAt = policy.CreatedAt,
            updatedAt = policy.UpdatedAt
        });
    }

    private static async Task<IResult> UpsertBookingPolicy(BookingPolicyPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var orgId = validation.OrganizationId!;
        var policy = await db.BookingPolicies.FirstOrDefaultAsync(x => x.OrganizationId == orgId, ct);

        if (policy is null)
        {
            policy = new BookingPolicy
            {
                OrganizationId = orgId,
                PreventStaffOverlap = payload.PreventStaffOverlap ?? true,
                BufferMinutes = payload.BufferMinutes ?? 0,
                RequireDeposit = payload.RequireDeposit ?? false,
                DefaultDepositAmount = payload.DefaultDepositAmount ?? 0,
                CancellationWindowHours = payload.CancellationWindowHours ?? 24,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.BookingPolicies.Add(policy);
        }
        else
        {
            policy.PreventStaffOverlap = payload.PreventStaffOverlap ?? policy.PreventStaffOverlap;
            policy.BufferMinutes = payload.BufferMinutes ?? policy.BufferMinutes;
            policy.RequireDeposit = payload.RequireDeposit ?? policy.RequireDeposit;
            policy.DefaultDepositAmount = payload.DefaultDepositAmount ?? policy.DefaultDepositAmount;
            policy.CancellationWindowHours = payload.CancellationWindowHours ?? policy.CancellationWindowHours;
            policy.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);

        return Results.Ok(new
        {
            id = policy.Id,
            organizationId = policy.OrganizationId,
            preventStaffOverlap = policy.PreventStaffOverlap,
            bufferMinutes = policy.BufferMinutes,
            requireDeposit = policy.RequireDeposit,
            defaultDepositAmount = policy.DefaultDepositAmount,
            cancellationWindowHours = policy.CancellationWindowHours,
            createdAt = policy.CreatedAt,
            updatedAt = policy.UpdatedAt
        });
    }

    private static async Task<IResult> ListCommissionRules(HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var rows = await db.StaffCommissionRules
            .AsNoTracking()
            .Where(x => x.OrganizationId == validation.OrganizationId)
            .OrderBy(x => x.StaffId)
            .ThenBy(x => x.ItemType)
            .ThenBy(x => x.ItemId)
            .Select(x => new
            {
                id = x.Id,
                staffId = x.StaffId,
                itemType = x.ItemType,
                itemId = x.ItemId,
                commissionType = x.CommissionType,
                commissionValue = x.CommissionValue
            })
            .ToListAsync(ct);

        return Results.Ok(rows);
    }

    private static async Task<IResult> UpsertCommissionRule(CommissionRulePayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var orgId = validation.OrganizationId!;

        var entity = await db.StaffCommissionRules.FirstOrDefaultAsync(x =>
            x.OrganizationId == orgId &&
            x.StaffId == payload.StaffId &&
            x.ItemType == payload.ItemType &&
            x.ItemId == payload.ItemId, ct);

        if (entity is null)
        {
            entity = new StaffCommissionRule
            {
                OrganizationId = orgId,
                StaffId = payload.StaffId,
                ItemType = payload.ItemType,
                ItemId = payload.ItemId,
                CommissionType = payload.CommissionType,
                CommissionValue = payload.CommissionValue,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.StaffCommissionRules.Add(entity);
        }
        else
        {
            entity.CommissionType = payload.CommissionType;
            entity.CommissionValue = payload.CommissionValue;
            entity.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Results.Ok(new
        {
            id = entity.Id,
            staffId = entity.StaffId,
            itemType = entity.ItemType,
            itemId = entity.ItemId,
            commissionType = entity.CommissionType,
            commissionValue = entity.CommissionValue
        });
    }

    private static async Task<IResult> BulkUpsertCommissionRules(BulkCommissionRulesPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var orgId = validation.OrganizationId!;

        var results = new List<object>();
        foreach (var rule in payload.Rules ?? new List<CommissionRulePayload>())
        {
            var entity = await db.StaffCommissionRules.FirstOrDefaultAsync(x =>
                x.OrganizationId == orgId &&
                x.StaffId == rule.StaffId &&
                x.ItemType == rule.ItemType &&
                x.ItemId == rule.ItemId, ct);

            if (entity is null)
            {
                entity = new StaffCommissionRule
                {
                    OrganizationId = orgId,
                    StaffId = rule.StaffId,
                    ItemType = rule.ItemType,
                    ItemId = rule.ItemId,
                    CommissionType = rule.CommissionType,
                    CommissionValue = rule.CommissionValue,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                db.StaffCommissionRules.Add(entity);
            }
            else
            {
                entity.CommissionType = rule.CommissionType;
                entity.CommissionValue = rule.CommissionValue;
                entity.UpdatedAt = DateTime.UtcNow;
            }

            await db.SaveChangesAsync(ct);
            results.Add(new
            {
                id = entity.Id,
                staffId = entity.StaffId,
                itemType = entity.ItemType,
                itemId = entity.ItemId,
                commissionType = entity.CommissionType,
                commissionValue = entity.CommissionValue
            });
        }

        return Results.Ok(new { rules = results });
    }

    private static async Task<IResult> DeleteCommissionRule(int id, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.StaffCommissionRules
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);

        if (entity is null) return Results.NotFound(new { success = false });

        db.StaffCommissionRules.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { success = true });
    }

    private static async Task<IResult> PreviewCommissionPayouts(CommissionPayoutRangePayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        if (!UtcDateTime.TryParseUtc(payload.From, out var from) || !UtcDateTime.TryParseUtc(payload.To, out var to))
        {
            return Results.BadRequest(new { message = "Invalid date range" });
        }

        var rows = await db.StaffCommissionPayouts
            .AsNoTracking()
            .Where(x => x.OrganizationId == validation.OrganizationId && x.FromDate >= from && x.ToDate <= to)
            .GroupBy(x => x.StaffId)
            .Select(group => new
            {
                staffId = group.Key,
                staffName = group.Key,
                totalAmount = group.Sum(x => x.TotalAmount),
                totalItems = group.Count()
            })
            .ToListAsync(ct);

        return Results.Ok(rows);
    }

    private static async Task<IResult> CreateCommissionPayouts(CommissionPayoutCreatePayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        if (!UtcDateTime.TryParseUtc(payload.From, out var from) || !UtcDateTime.TryParseUtc(payload.To, out var to))
        {
            return Results.BadRequest(new { message = "Invalid date range" });
        }

        var preview = await db.StaffCommissionPayouts
            .AsNoTracking()
            .Where(x => x.OrganizationId == validation.OrganizationId && x.FromDate >= from && x.ToDate <= to)
            .GroupBy(x => x.StaffId)
            .Select(group => new { staffId = group.Key, totalAmount = group.Sum(x => x.TotalAmount) })
            .ToListAsync(ct);

        var created = new List<StaffCommissionPayout>();
        foreach (var item in preview)
        {
            var entity = new StaffCommissionPayout
            {
                OrganizationId = validation.OrganizationId!,
                StaffId = item.staffId,
                FromDate = from,
                ToDate = to,
                TotalAmount = item.totalAmount,
                Status = "draft",
                Notes = payload.Notes,
                CreatedAt = DateTime.UtcNow
            };
            created.Add(entity);
        }

        if (created.Count > 0)
        {
            db.StaffCommissionPayouts.AddRange(created);
            await db.SaveChangesAsync(ct);
        }

        return Results.Ok(created.Select(MapCommissionPayout));
    }

    private static async Task<IResult> ListCommissionPayouts(HttpContext httpContext, string? from, string? to, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var query = db.StaffCommissionPayouts
            .AsNoTracking()
            .Where(x => x.OrganizationId == validation.OrganizationId);

        if (UtcDateTime.TryParseUtc(from, out var fromDate))
        {
            query = query.Where(x => x.FromDate >= fromDate);
        }
        if (UtcDateTime.TryParseUtc(to, out var toDate))
        {
            query = query.Where(x => x.ToDate <= toDate);
        }

        var rows = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        return Results.Ok(rows.Select(MapCommissionPayout));
    }

    private static async Task<IResult> MarkCommissionPayoutPaid(int id, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.StaffCommissionPayouts
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);
        if (entity is null) return Results.NotFound(new { message = "Commission payout not found" });

        entity.Status = "paid";
        entity.PaidAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Results.Ok(MapCommissionPayout(entity));
    }

    private static object MapCommissionPayout(StaffCommissionPayout payout) => new
    {
        id = payout.Id,
        organizationId = payout.OrganizationId,
        staffId = payout.StaffId,
        fromDate = payout.FromDate.ToString("yyyy-MM-dd"),
        toDate = payout.ToDate.ToString("yyyy-MM-dd"),
        totalAmount = payout.TotalAmount,
        status = payout.Status,
        notes = payout.Notes,
        paidAt = payout.PaidAt,
        createdAt = payout.CreatedAt
    };
}
