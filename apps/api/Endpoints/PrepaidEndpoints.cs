using Api.Data;
using Api.Models;
using Api.Utils;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class PrepaidEndpoints
{
    public static IEndpointRouteBuilder MapPrepaidEndpoints(this IEndpointRouteBuilder app)
    {
        var prepaid = app.MapGroup("/api/prepaid").RequireAuthorization();

        prepaid.MapGet("/plans", ListPlans);
        prepaid.MapPost("/plans", CreatePlan);
        prepaid.MapPut("/plans/{id:int}", UpdatePlan);
        prepaid.MapDelete("/plans/{id:int}", DeletePlan);

        prepaid.MapGet("/cards", ListCards);
        prepaid.MapPost("/cards", CreateCard);
        prepaid.MapPost("/cards/{cardId:int}/consume", ConsumeCard);
        prepaid.MapPost("/cards/{cardId:int}/topup", TopupCard);

        prepaid.MapGet("/transactions", ListTransactions);

        return app;
    }

    private sealed record PlanPayload(string? Name, string? Description, string? Unit, double? SalePrice, double? InitialBalance, int? ExpiryDays, bool? IsActive);
    private sealed record CardPayload(int CustomerId, int? PlanId, string? CardCode, string? Unit, double? PurchasePrice, double? InitialBalance, string? ExpiredAt, string? Notes);
    private sealed record AdjustPayload(double Amount, int? InvoiceId, string? Notes);

    private static async Task<IResult> ListPlans(HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var rows = await db.PrepaidPlans.AsNoTracking()
            .Where(x => x.OrganizationId == validation.OrganizationId)
            .OrderBy(x => x.Name)
            .ToListAsync(ct);

        return Results.Ok(rows.Select(MapPlan));
    }

    private static async Task<IResult> CreatePlan(PlanPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        if (string.IsNullOrWhiteSpace(payload.Name) || string.IsNullOrWhiteSpace(payload.Unit) || payload.SalePrice is null || payload.InitialBalance is null || payload.ExpiryDays is null)
        {
            return Results.BadRequest(new { message = "Missing required fields" });
        }

        var entity = new PrepaidPlan
        {
            OrganizationId = validation.OrganizationId!,
            Name = payload.Name,
            Description = payload.Description,
            Unit = payload.Unit,
            SalePrice = payload.SalePrice.Value,
            InitialBalance = payload.InitialBalance.Value,
            ExpiryDays = payload.ExpiryDays.Value,
            IsActive = payload.IsActive ?? true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.PrepaidPlans.Add(entity);
        await db.SaveChangesAsync(ct);
        return Results.Created($"/api/prepaid/plans/{entity.Id}", MapPlan(entity));
    }

    private static async Task<IResult> UpdatePlan(int id, PlanPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.PrepaidPlans.FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);
        if (entity is null) return Results.NotFound(new { message = "Plan not found" });

        entity.Name = payload.Name ?? entity.Name;
        entity.Description = payload.Description ?? entity.Description;
        entity.Unit = payload.Unit ?? entity.Unit;
        entity.SalePrice = payload.SalePrice ?? entity.SalePrice;
        entity.InitialBalance = payload.InitialBalance ?? entity.InitialBalance;
        entity.ExpiryDays = payload.ExpiryDays ?? entity.ExpiryDays;
        entity.IsActive = payload.IsActive ?? entity.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return Results.Ok(MapPlan(entity));
    }

    private static async Task<IResult> DeletePlan(int id, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.PrepaidPlans.FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);
        if (entity is null) return Results.NotFound(new { message = "Plan not found" });

        db.PrepaidPlans.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { message = "Deleted" });
    }

    private static async Task<IResult> ListCards(HttpContext httpContext, int? customerId, string? status, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var query = db.CustomerPrepaidCards.AsNoTracking().Where(x => x.OrganizationId == validation.OrganizationId);
        if (customerId is int cid) query = query.Where(x => x.CustomerId == cid);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);

        var cards = await query.OrderByDescending(x => x.PurchasedAt).ToListAsync(ct);
        return Results.Ok(cards.Select(MapCard));
    }

    private static async Task<IResult> CreateCard(CardPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var orgId = validation.OrganizationId!;

        var customerExists = await db.Customers.AsNoTracking().AnyAsync(x => x.OrganizationId == orgId && x.Id == payload.CustomerId, ct);
        if (!customerExists) return Results.BadRequest(new { message = "Invalid customer" });

        PrepaidPlan? plan = null;
        if (payload.PlanId is int planId)
        {
            plan = await db.PrepaidPlans.AsNoTracking().FirstOrDefaultAsync(x => x.OrganizationId == orgId && x.Id == planId, ct);
            if (plan is null) return Results.BadRequest(new { message = "Invalid plan" });
        }

        var now = DateTime.UtcNow;
        var initial = payload.InitialBalance ?? plan?.InitialBalance ?? 0;
        var purchase = payload.PurchasePrice ?? plan?.SalePrice ?? initial;
        var unit = payload.Unit ?? plan?.Unit ?? "vnd";

        var card = new CustomerPrepaidCard
        {
            OrganizationId = orgId,
            CustomerId = payload.CustomerId,
            PlanId = payload.PlanId,
            CardCode = string.IsNullOrWhiteSpace(payload.CardCode) ? $"CARD-{Guid.NewGuid():N}"[..12].ToUpperInvariant() : payload.CardCode,
            Unit = unit,
            PurchasePrice = purchase,
            InitialBalance = initial,
            RemainingBalance = initial,
            Status = "active",
            Notes = payload.Notes,
            PurchasedAt = now,
            ExpiredAt = UtcDateTime.TryParseUtc(payload.ExpiredAt, out var ex) ? ex : plan is null ? null : now.AddDays(plan.ExpiryDays),
            CreatedAt = now,
            UpdatedAt = now
        };

        db.CustomerPrepaidCards.Add(card);
        await db.SaveChangesAsync(ct);

        var txn = new CustomerPrepaidTransaction
        {
            OrganizationId = orgId,
            CardId = card.Id,
            CustomerId = card.CustomerId,
            Type = "purchase",
            Amount = card.InitialBalance,
            BalanceAfter = card.RemainingBalance,
            Notes = "Initial purchase",
            CreatedAt = now
        };
        db.CustomerPrepaidTransactions.Add(txn);
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/prepaid/cards/{card.Id}", MapCard(card));
    }

    private static async Task<IResult> ConsumeCard(int cardId, AdjustPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        return await AdjustCardBalance(cardId, payload, "consume", -1, httpContext, db, ct);
    }

    private static async Task<IResult> TopupCard(int cardId, AdjustPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        return await AdjustCardBalance(cardId, payload, "topup", 1, httpContext, db, ct);
    }

    private static async Task<IResult> AdjustCardBalance(int cardId, AdjustPayload payload, string type, int direction, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var card = await db.CustomerPrepaidCards.FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == cardId, ct);
        if (card is null) return Results.NotFound(new { message = "Card not found" });
        if (payload.Amount <= 0) return Results.BadRequest(new { message = "Invalid amount" });

        var nextBalance = card.RemainingBalance + direction * payload.Amount;
        if (nextBalance < 0) return Results.BadRequest(new { message = "Insufficient balance" });

        card.RemainingBalance = nextBalance;
        card.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        var txn = new CustomerPrepaidTransaction
        {
            OrganizationId = card.OrganizationId,
            CardId = card.Id,
            CustomerId = card.CustomerId,
            InvoiceId = payload.InvoiceId,
            Type = type,
            Amount = payload.Amount,
            BalanceAfter = card.RemainingBalance,
            Notes = payload.Notes,
            CreatedAt = DateTime.UtcNow
        };

        db.CustomerPrepaidTransactions.Add(txn);
        await db.SaveChangesAsync(ct);

        return Results.Ok(new { card = MapCard(card), transaction = MapTransaction(txn) });
    }

    private static async Task<IResult> ListTransactions(HttpContext httpContext, int? cardId, int? customerId, DateTime? from, DateTime? to, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var utcFrom = UtcDateTime.EnsureUtc(from);
        var utcTo = UtcDateTime.EnsureUtc(to);

        var query = db.CustomerPrepaidTransactions.AsNoTracking().Where(x => x.OrganizationId == validation.OrganizationId);
        if (cardId is int c) query = query.Where(x => x.CardId == c);
        if (customerId is int cid) query = query.Where(x => x.CustomerId == cid);
        if (utcFrom is DateTime f) query = query.Where(x => x.CreatedAt >= f);
        if (utcTo is DateTime t) query = query.Where(x => x.CreatedAt <= t);

        var rows = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        return Results.Ok(rows.Select(MapTransaction));
    }

    private static object MapPlan(PrepaidPlan p) => new
    {
        id = p.Id,
        organizationId = p.OrganizationId,
        name = p.Name,
        description = p.Description,
        unit = p.Unit,
        salePrice = p.SalePrice,
        initialBalance = p.InitialBalance,
        expiryDays = p.ExpiryDays,
        isActive = p.IsActive,
        createdAt = p.CreatedAt,
        updatedAt = p.UpdatedAt
    };

    private static object MapCard(CustomerPrepaidCard c) => new
    {
        id = c.Id,
        organizationId = c.OrganizationId,
        customerId = c.CustomerId,
        planId = c.PlanId,
        cardCode = c.CardCode,
        unit = c.Unit,
        purchasePrice = c.PurchasePrice,
        initialBalance = c.InitialBalance,
        remainingBalance = c.RemainingBalance,
        status = c.Status,
        notes = c.Notes,
        purchasedAt = c.PurchasedAt,
        expiredAt = c.ExpiredAt
    };

    private static object MapTransaction(CustomerPrepaidTransaction t) => new
    {
        id = t.Id,
        organizationId = t.OrganizationId,
        cardId = t.CardId,
        customerId = t.CustomerId,
        invoiceId = t.InvoiceId,
        type = t.Type,
        amount = t.Amount,
        balanceAfter = t.BalanceAfter,
        notes = t.Notes,
        createdAt = t.CreatedAt
    };
}
