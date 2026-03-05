using Api.Data;
using Api.Models;
using Api.Utils;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class PayrollEndpoints
{
    public static IEndpointRouteBuilder MapPayrollEndpoints(this IEndpointRouteBuilder app)
    {
        var payroll = app.MapGroup("/api/payroll").RequireAuthorization();

        payroll.MapGet("/configs", ListConfigs);
        payroll.MapPost("/configs", SaveConfig);

        payroll.MapGet("/cycles", ListCycles);
        payroll.MapPost("/cycles/preview", PreviewCycle);
        payroll.MapPost("/cycles", CreateCycle);
        payroll.MapGet("/cycles/{id:int}", GetCycle);
        payroll.MapGet("/cycles/{cycleId:int}/items", ListItems);
        payroll.MapPatch("/items/{id:int}", UpdateItem);
        payroll.MapPatch("/cycles/{id:int}/finalize", FinalizeCycle);
        payroll.MapPatch("/cycles/{id:int}/pay", PayCycle);

        return app;
    }

    private sealed record ConfigPayload(int? Id, string StaffId, int? BranchId, string? SalaryType, double? BaseSalary, double? DefaultAllowance, double? DefaultDeduction, double? DefaultAdvance, string? PaymentMethod, string? EffectiveFrom, bool? IsActive, string? Notes);
    private sealed record PreviewPayload(string From, string To, int? BranchId);
    private sealed record CreateCyclePayload(string From, string To, int? BranchId, string? Name, string? Notes);
    private sealed record UpdateItemPayload(double? BonusAmount, double? AllowanceAmount, double? DeductionAmount, double? AdvanceAmount, string? Notes, string? PaymentMethod);
    private sealed record PayCyclePayload(string? PaidAt);

    private static async Task<IResult> ListConfigs(HttpContext httpContext, int? branchId, string? staffId, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        var effectiveBranchId = resolvedBranchId ?? branchId;

        var query = db.PayrollConfigs.AsNoTracking().Where(x => x.OrganizationId == validation.OrganizationId);
        if (effectiveBranchId is int bid) query = query.Where(x => x.BranchId == bid);
        if (!string.IsNullOrWhiteSpace(staffId)) query = query.Where(x => x.StaffId == staffId);

        var rows = await query.OrderByDescending(x => x.UpdatedAt).ToListAsync(ct);
        return Results.Ok(rows.Select(MapConfig));
    }

    private static async Task<IResult> SaveConfig(ConfigPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var orgId = validation.OrganizationId!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);

        if (resolvedBranchId is int scopedBranchId && payload.BranchId is int requestBranchId && requestBranchId != scopedBranchId)
        {
            return Results.BadRequest(new { message = "branchId mismatch between header and request payload." });
        }

        PayrollConfig? entity = null;
        if (payload.Id is int id)
        {
            entity = await db.PayrollConfigs.FirstOrDefaultAsync(x => x.OrganizationId == orgId && x.Id == id, ct);
            if (entity is not null && resolvedBranchId is int resolvedBranchForEntity && entity.BranchId != resolvedBranchForEntity)
            {
                return Results.Forbid();
            }
        }

        if (entity is null)
        {
            entity = new PayrollConfig
            {
                OrganizationId = orgId,
                StaffId = payload.StaffId,
                CreatedAt = DateTime.UtcNow
            };
            db.PayrollConfigs.Add(entity);
        }

        entity.BranchId = resolvedBranchId ?? payload.BranchId ?? entity.BranchId;
        entity.SalaryType = payload.SalaryType ?? entity.SalaryType ?? "monthly";
        entity.BaseSalary = payload.BaseSalary ?? entity.BaseSalary;
        entity.DefaultAllowance = payload.DefaultAllowance ?? entity.DefaultAllowance;
        entity.DefaultDeduction = payload.DefaultDeduction ?? entity.DefaultDeduction;
        entity.DefaultAdvance = payload.DefaultAdvance ?? entity.DefaultAdvance;
        entity.PaymentMethod = payload.PaymentMethod ?? entity.PaymentMethod ?? "transfer";
        entity.EffectiveFrom = UtcDateTime.TryParseUtc(payload.EffectiveFrom, out var effective)
            ? effective
            : entity.EffectiveFrom == default
                ? UtcDateTime.EnsureUtc(DateTime.UtcNow.Date)
                : UtcDateTime.EnsureUtc(entity.EffectiveFrom);
        entity.IsActive = payload.IsActive ?? entity.IsActive;
        entity.Notes = payload.Notes ?? entity.Notes;
        entity.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return Results.Ok(MapConfig(entity));
    }

    private static async Task<IResult> ListCycles(HttpContext httpContext, int? branchId, string? status, DateTime? from, DateTime? to, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var utcFrom = UtcDateTime.EnsureUtc(from);
        var utcTo = UtcDateTime.EnsureUtc(to);
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        var effectiveBranchId = resolvedBranchId ?? branchId;

        var query = db.PayrollCycles.AsNoTracking().Where(x => x.OrganizationId == validation.OrganizationId);
        if (effectiveBranchId is int bid) query = query.Where(x => x.BranchId == bid);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
        if (utcFrom is DateTime f) query = query.Where(x => x.FromDate >= f);
        if (utcTo is DateTime t) query = query.Where(x => x.ToDate <= t);

        var rows = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        return Results.Ok(rows.Select(MapCycle));
    }

    private static async Task<IResult> PreviewCycle(PreviewPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var orgId = validation.OrganizationId!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);

        if (resolvedBranchId is int scopedBranchId && payload.BranchId is int requestBranchId && requestBranchId != scopedBranchId)
        {
            return Results.BadRequest(new { message = "branchId mismatch between header and request payload." });
        }
        var effectiveBranchId = resolvedBranchId ?? payload.BranchId;

        var configs = await db.PayrollConfigs.AsNoTracking()
            .Where(x => x.OrganizationId == orgId && x.IsActive)
            .Where(x => effectiveBranchId == null || x.BranchId == effectiveBranchId)
            .ToListAsync(ct);

        var memberNames = await (
            from m in db.Members.AsNoTracking()
            join u in db.Users.AsNoTracking() on m.UserId equals u.Id
            where m.OrganizationId == orgId
            select new { m.Id, u.Name }
        ).ToDictionaryAsync(x => x.Id, x => x.Name, ct);

        var rows = configs.Select(config =>
        {
            var baseSalary = config.BaseSalary;
            var allowance = config.DefaultAllowance;
            var deduction = config.DefaultDeduction;
            var advance = config.DefaultAdvance;
            var net = baseSalary + allowance - deduction - advance;

            return new
            {
                staffId = config.StaffId,
                staffName = memberNames.TryGetValue(config.StaffId, out var n) ? n : config.StaffId,
                branchId = config.BranchId,
                configId = config.Id,
                salaryType = config.SalaryType,
                paymentMethod = config.PaymentMethod,
                baseSalary,
                commissionAmount = 0d,
                bonusAmount = 0d,
                allowanceAmount = allowance,
                deductionAmount = deduction,
                advanceAmount = advance,
                netAmount = net
            };
        }).ToList();

        return Results.Ok(rows);
    }

    private static async Task<IResult> CreateCycle(CreateCyclePayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);

        if (resolvedBranchId is int scopedBranchId && payload.BranchId is int requestBranchId && requestBranchId != scopedBranchId)
        {
            return Results.BadRequest(new { message = "branchId mismatch between header and request payload." });
        }

        if (!UtcDateTime.TryParseUtc(payload.From, out var from) || !UtcDateTime.TryParseUtc(payload.To, out var to))
        {
            return Results.BadRequest(new { message = "Invalid date range" });
        }

        var cycle = new PayrollCycle
        {
            OrganizationId = validation.OrganizationId!,
            BranchId = resolvedBranchId ?? payload.BranchId,
            Name = string.IsNullOrWhiteSpace(payload.Name) ? $"Payroll {from:yyyy-MM-dd} - {to:yyyy-MM-dd}" : payload.Name,
            FromDate = from,
            ToDate = to,
            Status = "draft",
            Notes = payload.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.PayrollCycles.Add(cycle);
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/payroll/cycles/{cycle.Id}", MapCycle(cycle));
    }

    private static async Task<IResult> GetCycle(int id, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);

        var cycle = await db.PayrollCycles.AsNoTracking().FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);
        if (cycle is null) return Results.NotFound(new { message = "Cycle not found" });
        if (resolvedBranchId is int scopedBranchId && cycle.BranchId != scopedBranchId) return Results.Forbid();

        var items = await db.PayrollItems.AsNoTracking().Where(x => x.OrganizationId == validation.OrganizationId && x.CycleId == id).ToListAsync(ct);
        var mapped = MapCycle(cycle);
        return Results.Ok(new
        {
            mapped.id,
            mapped.organizationId,
            mapped.branchId,
            mapped.name,
            mapped.fromDate,
            mapped.toDate,
            mapped.status,
            mapped.notes,
            mapped.createdByUserId,
            mapped.finalizedByUserId,
            mapped.paidByUserId,
            mapped.finalizedAt,
            mapped.paidAt,
            mapped.createdAt,
            mapped.updatedAt,
            branch = (object?)null,
            items = items.Select(MapItem)
        });
    }

    private static async Task<IResult> ListItems(int cycleId, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);

        var items = await db.PayrollItems.AsNoTracking()
            .Where(x => x.OrganizationId == validation.OrganizationId && x.CycleId == cycleId)
            .Where(x => resolvedBranchId == null || x.BranchId == resolvedBranchId)
            .OrderBy(x => x.Id)
            .ToListAsync(ct);

        return Results.Ok(items.Select(MapItem));
    }

    private static async Task<IResult> UpdateItem(int id, UpdateItemPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);

        var item = await db.PayrollItems.FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);
        if (item is null) return Results.NotFound(new { message = "Payroll item not found" });
        if (resolvedBranchId is int scopedBranchId && item.BranchId != scopedBranchId) return Results.Forbid();

        item.BonusAmount = payload.BonusAmount ?? item.BonusAmount;
        item.AllowanceAmount = payload.AllowanceAmount ?? item.AllowanceAmount;
        item.DeductionAmount = payload.DeductionAmount ?? item.DeductionAmount;
        item.AdvanceAmount = payload.AdvanceAmount ?? item.AdvanceAmount;
        item.Notes = payload.Notes ?? item.Notes;
        item.PaymentMethod = payload.PaymentMethod ?? item.PaymentMethod;
        item.NetAmount = item.BaseSalary + item.CommissionAmount + item.BonusAmount + item.AllowanceAmount - item.DeductionAmount - item.AdvanceAmount;
        item.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return Results.Ok(MapItem(item));
    }

    private static async Task<IResult> FinalizeCycle(int id, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);

        var cycle = await db.PayrollCycles.FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);
        if (cycle is null) return Results.NotFound(new { message = "Cycle not found" });
        if (resolvedBranchId is int scopedBranchId && cycle.BranchId != scopedBranchId) return Results.Forbid();

        cycle.Status = "finalized";
        cycle.FinalizedAt = DateTime.UtcNow;
        cycle.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Results.Ok(MapCycle(cycle));
    }

    private static async Task<IResult> PayCycle(int id, PayCyclePayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);

        var cycle = await db.PayrollCycles.FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);
        if (cycle is null) return Results.NotFound(new { message = "Cycle not found" });
        if (resolvedBranchId is int scopedBranchId && cycle.BranchId != scopedBranchId) return Results.Forbid();

        var paidAt = UtcDateTime.TryParseUtc(payload.PaidAt, out var t) ? t : DateTime.UtcNow;
        cycle.Status = "paid";
        cycle.PaidAt = paidAt;
        cycle.UpdatedAt = DateTime.UtcNow;

        var items = await db.PayrollItems.Where(x => x.OrganizationId == validation.OrganizationId && x.CycleId == id).ToListAsync(ct);
        foreach (var item in items)
        {
            item.Status = "paid";
            item.PaidAt = paidAt;
            item.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Results.Ok(MapCycle(cycle));
    }

    private static dynamic MapConfig(PayrollConfig c) => new
    {
        id = c.Id,
        organizationId = c.OrganizationId,
        branchId = c.BranchId,
        staffId = c.StaffId,
        salaryType = c.SalaryType,
        baseSalary = c.BaseSalary,
        defaultAllowance = c.DefaultAllowance,
        defaultDeduction = c.DefaultDeduction,
        defaultAdvance = c.DefaultAdvance,
        paymentMethod = c.PaymentMethod,
        effectiveFrom = c.EffectiveFrom,
        isActive = c.IsActive,
        notes = c.Notes,
        createdAt = c.CreatedAt,
        updatedAt = c.UpdatedAt,
        branch = (object?)null,
        staff = (object?)null
    };

    private static dynamic MapCycle(PayrollCycle c) => new
    {
        id = c.Id,
        organizationId = c.OrganizationId,
        branchId = c.BranchId,
        name = c.Name,
        fromDate = c.FromDate,
        toDate = c.ToDate,
        status = c.Status,
        notes = c.Notes,
        createdByUserId = c.CreatedByUserId,
        finalizedByUserId = c.FinalizedByUserId,
        paidByUserId = c.PaidByUserId,
        finalizedAt = c.FinalizedAt,
        paidAt = c.PaidAt,
        createdAt = c.CreatedAt,
        updatedAt = c.UpdatedAt,
        branch = (object?)null,
        items = Array.Empty<object>()
    };

    private static dynamic MapItem(PayrollItem i) => new
    {
        id = i.Id,
        organizationId = i.OrganizationId,
        cycleId = i.CycleId,
        staffId = i.StaffId,
        branchId = i.BranchId,
        baseSalary = i.BaseSalary,
        commissionAmount = i.CommissionAmount,
        bonusAmount = i.BonusAmount,
        allowanceAmount = i.AllowanceAmount,
        deductionAmount = i.DeductionAmount,
        advanceAmount = i.AdvanceAmount,
        netAmount = i.NetAmount,
        paymentMethod = i.PaymentMethod,
        status = i.Status,
        paidAt = i.PaidAt,
        notes = i.Notes,
        createdAt = i.CreatedAt,
        updatedAt = i.UpdatedAt,
        staff = (object?)null,
        branch = (object?)null
    };
}
