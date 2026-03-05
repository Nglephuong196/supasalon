using Api.Data;
using Api.Models;
using Api.Utils;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class CashManagementEndpoints
{
    private sealed record CashSessionSnapshotDto(
        int SessionId,
        double OpeningBalance,
        double InvoiceCashIn,
        double InvoiceCashOut,
        double ManualIn,
        double ManualOut,
        double ExpectedClosingBalance);

    public static IEndpointRouteBuilder MapCashManagementEndpoints(this IEndpointRouteBuilder app)
    {
        var cash = app.MapGroup("/api/cash-management").RequireAuthorization();

        cash.MapGet("/overview", Overview);
        cash.MapGet("/session/current", CurrentSession);
        cash.MapGet("/sessions", ListSessions);
        cash.MapPost("/session/open", OpenSession);
        cash.MapPost("/session/{id:int}/close", CloseSession);

        cash.MapGet("/transactions", ListTransactions);
        cash.MapPost("/transactions", CreateTransaction);

        cash.MapGet("/report/payment-method", PaymentMethodReport);
        cash.MapGet("/pending-payments", PendingPayments);
        cash.MapPatch("/payments/{id:int}/confirm", ConfirmPayment);
        cash.MapPatch("/payments/{id:int}/fail", FailPayment);

        return app;
    }

    private sealed record OpenSessionPayload(double OpeningBalance, string? Notes);
    private sealed record CloseSessionPayload(double ActualClosingBalance, string? Notes);
    private sealed record TransactionPayload(string Type, double Amount, string? Category, string? Notes, int? CashSessionId);
    private sealed record NotePayload(string? Note);

    private static async Task<IResult> Overview(HttpContext httpContext, DateTime? from, DateTime? to, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var orgId = validation.OrganizationId!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        if (resolvedBranchId is null) return Results.BadRequest(new { message = "X-Branch-Id header is required for cash management." });
        var utcFrom = UtcDateTime.EnsureUtc(from);
        var utcTo = UtcDateTime.EnsureUtc(to);

        var session = await db.CashSessions.AsNoTracking()
            .Where(x => x.OrganizationId == orgId && x.BranchId == resolvedBranchId && x.Status == "open")
            .OrderByDescending(x => x.OpenedAt)
            .FirstOrDefaultAsync(ct);

        var snapshot = session is null ? null : await BuildSnapshot(db, orgId, session, ct);
        var reportResult = await BuildPaymentReport(db, orgId, utcFrom, utcTo, resolvedBranchId, ct);
        var pendingCountQuery =
            from payment in db.InvoicePaymentTransactions.AsNoTracking()
            join invoice in db.Invoices.AsNoTracking() on payment.InvoiceId equals invoice.Id
            where payment.OrganizationId == orgId && payment.Status == "pending"
            select new { payment, invoice };
        if (resolvedBranchId is int scopedBranchId)
        {
            pendingCountQuery = pendingCountQuery.Where(x => x.invoice.BranchId == scopedBranchId);
        }
        var pendingCount = await pendingCountQuery.CountAsync(ct);

        return Results.Ok(new
        {
            currentSession = session is null ? null : MapSession(session),
            currentSnapshot = snapshot,
            paymentReport = reportResult,
            pendingPaymentsCount = pendingCount
        });
    }

    private static async Task<IResult> CurrentSession(HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var orgId = validation.OrganizationId!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        if (resolvedBranchId is null) return Results.BadRequest(new { message = "X-Branch-Id header is required for cash management." });

        var session = await db.CashSessions.AsNoTracking()
            .Where(x => x.OrganizationId == orgId && x.BranchId == resolvedBranchId && x.Status == "open")
            .OrderByDescending(x => x.OpenedAt)
            .FirstOrDefaultAsync(ct);

        var snapshot = session is null ? null : await BuildSnapshot(db, orgId, session, ct);
        return Results.Ok(new
        {
            currentSession = session is null ? null : MapSession(session),
            currentSnapshot = snapshot
        });
    }

    private static async Task<IResult> ListSessions(HttpContext httpContext, DateTime? from, DateTime? to, string? status, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var orgId = validation.OrganizationId!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        if (resolvedBranchId is null) return Results.BadRequest(new { message = "X-Branch-Id header is required for cash management." });
        var utcFrom = UtcDateTime.EnsureUtc(from);
        var utcTo = UtcDateTime.EnsureUtc(to);

        var query = db.CashSessions.AsNoTracking().Where(x => x.OrganizationId == orgId && x.BranchId == resolvedBranchId);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
        if (utcFrom is DateTime f) query = query.Where(x => x.OpenedAt >= f);
        if (utcTo is DateTime t) query = query.Where(x => x.OpenedAt <= t);

        var rows = await query.OrderByDescending(x => x.OpenedAt).ToListAsync(ct);
        return Results.Ok(rows.Select(MapSession));
    }

    private static async Task<IResult> OpenSession(OpenSessionPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        if (resolvedBranchId is null) return Results.BadRequest(new { message = "X-Branch-Id header is required for cash management." });

        var existingOpen = await db.CashSessions.AnyAsync(x => x.OrganizationId == validation.OrganizationId && x.BranchId == resolvedBranchId && x.Status == "open", ct);
        if (existingOpen) return Results.BadRequest(new { message = "An open session already exists" });

        var entity = new CashSession
        {
            OrganizationId = validation.OrganizationId!,
            BranchId = resolvedBranchId,
            OpeningBalance = payload.OpeningBalance,
            ExpectedClosingBalance = payload.OpeningBalance,
            Status = "open",
            Notes = payload.Notes,
            OpenedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.CashSessions.Add(entity);
        await db.SaveChangesAsync(ct);

        return Results.Ok(MapSession(entity));
    }

    private static async Task<IResult> CloseSession(int id, CloseSessionPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        if (resolvedBranchId is null) return Results.BadRequest(new { message = "X-Branch-Id header is required for cash management." });

        var session = await db.CashSessions.FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.BranchId == resolvedBranchId && x.Id == id, ct);
        if (session is null) return Results.NotFound(new { message = "Session not found" });
        if (session.Status != "open") return Results.BadRequest(new { message = "Session already closed" });

        var snapshot = await BuildSnapshot(db, validation.OrganizationId!, session, ct);
        var discrepancy = payload.ActualClosingBalance - snapshot.ExpectedClosingBalance;

        session.ActualClosingBalance = payload.ActualClosingBalance;
        session.ExpectedClosingBalance = snapshot.ExpectedClosingBalance;
        session.Discrepancy = discrepancy;
        session.Notes = payload.Notes ?? session.Notes;
        session.Status = "closed";
        session.ClosedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        return Results.Ok(new
        {
            session = MapSession(session),
            snapshot,
            discrepancy
        });
    }

    private static async Task<IResult> ListTransactions(HttpContext httpContext, int? cashSessionId, DateTime? from, DateTime? to, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        if (resolvedBranchId is null) return Results.BadRequest(new { message = "X-Branch-Id header is required for cash management." });
        var utcFrom = UtcDateTime.EnsureUtc(from);
        var utcTo = UtcDateTime.EnsureUtc(to);

        var query = db.CashTransactions.AsNoTracking().Where(x => x.OrganizationId == validation.OrganizationId && x.BranchId == resolvedBranchId);
        if (cashSessionId is int id) query = query.Where(x => x.CashSessionId == id);
        if (utcFrom is DateTime f) query = query.Where(x => x.CreatedAt >= f);
        if (utcTo is DateTime t) query = query.Where(x => x.CreatedAt <= t);

        var rows = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        return Results.Ok(rows.Select(MapTransaction));
    }

    private static async Task<IResult> CreateTransaction(TransactionPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        if (resolvedBranchId is null) return Results.BadRequest(new { message = "X-Branch-Id header is required for cash management." });

        var cashSessionId = payload.CashSessionId;
        if (cashSessionId is null)
        {
            cashSessionId = await db.CashSessions.AsNoTracking()
                .Where(x => x.OrganizationId == validation.OrganizationId && x.BranchId == resolvedBranchId && x.Status == "open")
                .OrderByDescending(x => x.OpenedAt)
                .Select(x => (int?)x.Id)
                .FirstOrDefaultAsync(ct);
        }
        else
        {
            var sessionExists = await db.CashSessions.AsNoTracking()
                .AnyAsync(x => x.OrganizationId == validation.OrganizationId && x.BranchId == resolvedBranchId && x.Id == cashSessionId, ct);
            if (!sessionExists)
            {
                return Results.BadRequest(new { message = "Invalid cash session for selected branch." });
            }
        }

        if (cashSessionId is null) return Results.BadRequest(new { message = "No open session found" });

        var entity = new CashTransaction
        {
            OrganizationId = validation.OrganizationId!,
            BranchId = resolvedBranchId,
            CashSessionId = cashSessionId,
            Type = payload.Type,
            Category = string.IsNullOrWhiteSpace(payload.Category) ? (payload.Type == "in" ? "manual_in" : "manual_out") : payload.Category,
            Amount = payload.Amount,
            Notes = payload.Notes,
            CreatedAt = DateTime.UtcNow
        };

        db.CashTransactions.Add(entity);
        await db.SaveChangesAsync(ct);

        return Results.Ok(MapTransaction(entity));
    }

    private static async Task<IResult> PaymentMethodReport(HttpContext httpContext, DateTime? from, DateTime? to, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        if (resolvedBranchId is null) return Results.BadRequest(new { message = "X-Branch-Id header is required for cash management." });
        var utcFrom = UtcDateTime.EnsureUtc(from);
        var utcTo = UtcDateTime.EnsureUtc(to);

        var report = await BuildPaymentReport(db, validation.OrganizationId!, utcFrom, utcTo, resolvedBranchId, ct);
        return Results.Ok(report);
    }

    private static async Task<IResult> PendingPayments(HttpContext httpContext, DateTime? from, DateTime? to, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        if (resolvedBranchId is null) return Results.BadRequest(new { message = "X-Branch-Id header is required for cash management." });
        var utcFrom = UtcDateTime.EnsureUtc(from);
        var utcTo = UtcDateTime.EnsureUtc(to);

        var query =
            from payment in db.InvoicePaymentTransactions.AsNoTracking()
            join invoice in db.Invoices.AsNoTracking() on payment.InvoiceId equals invoice.Id
            where payment.OrganizationId == validation.OrganizationId && payment.Status == "pending"
            select new { payment, invoice };

        if (utcFrom is DateTime f) query = query.Where(x => x.payment.CreatedAt >= f);
        if (utcTo is DateTime t) query = query.Where(x => x.payment.CreatedAt <= t);
        if (resolvedBranchId is int scopedBranchId) query = query.Where(x => x.invoice.BranchId == scopedBranchId);

        var rows = await query.OrderByDescending(x => x.payment.CreatedAt).ToListAsync(ct);
        return Results.Ok(rows.Select(x => new
        {
            id = x.payment.Id,
            organizationId = x.payment.OrganizationId,
            invoiceId = x.payment.InvoiceId,
            cashSessionId = x.payment.CashSessionId,
            kind = x.payment.Kind,
            method = x.payment.Method,
            status = x.payment.Status,
            amount = x.payment.Amount,
            referenceCode = x.payment.ReferenceCode,
            notes = x.payment.Notes,
            createdAt = x.payment.CreatedAt,
            confirmedAt = x.payment.ConfirmedAt,
            invoice = new { id = x.invoice.Id, total = x.invoice.Total, customer = (object?)null }
        }));
    }

    private static async Task<IResult> ConfirmPayment(int id, NotePayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        return await SetPaymentStatus(id, "confirmed", payload.Note, httpContext, db, ct);
    }

    private static async Task<IResult> FailPayment(int id, NotePayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        return await SetPaymentStatus(id, "failed", payload.Note, httpContext, db, ct);
    }

    private static async Task<IResult> SetPaymentStatus(int id, string status, string? note, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        if (resolvedBranchId is null) return Results.BadRequest(new { message = "X-Branch-Id header is required for cash management." });

        var payment = await db.InvoicePaymentTransactions
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);
        if (payment is null) return Results.NotFound(new { message = "Payment not found" });
        if (resolvedBranchId is int scopedBranchId)
        {
            var invoiceBranchId = await db.Invoices.AsNoTracking()
                .Where(x => x.OrganizationId == validation.OrganizationId && x.Id == payment.InvoiceId)
                .Select(x => x.BranchId)
                .FirstOrDefaultAsync(ct);
            if (invoiceBranchId != scopedBranchId)
            {
                return Results.Forbid();
            }
        }

        payment.Status = status;
        payment.Notes = note ?? payment.Notes;
        payment.ConfirmedAt = status == "confirmed" ? DateTime.UtcNow : payment.ConfirmedAt;
        await db.SaveChangesAsync(ct);

        return Results.Ok(new
        {
            id = payment.Id,
            organizationId = payment.OrganizationId,
            invoiceId = payment.InvoiceId,
            cashSessionId = payment.CashSessionId,
            kind = payment.Kind,
            method = payment.Method,
            status = payment.Status,
            amount = payment.Amount,
            referenceCode = payment.ReferenceCode,
            notes = payment.Notes,
            createdAt = payment.CreatedAt,
            confirmedAt = payment.ConfirmedAt
        });
    }

    private static async Task<List<object>> BuildPaymentReport(AppDbContext db, string orgId, DateTime? from, DateTime? to, int? branchId, CancellationToken ct)
    {
        var utcFrom = UtcDateTime.EnsureUtc(from);
        var utcTo = UtcDateTime.EnsureUtc(to);
        var query =
            from payment in db.InvoicePaymentTransactions.AsNoTracking()
            join invoice in db.Invoices.AsNoTracking() on payment.InvoiceId equals invoice.Id
            where payment.OrganizationId == orgId
            select new { payment, invoice };
        if (utcFrom is DateTime f) query = query.Where(x => x.payment.CreatedAt >= f);
        if (utcTo is DateTime t) query = query.Where(x => x.payment.CreatedAt <= t);
        if (branchId is int scopedBranchId) query = query.Where(x => x.invoice.BranchId == scopedBranchId);

        var rows = await query.Select(x => x.payment).ToListAsync(ct);

        return rows
            .GroupBy(x => x.Method)
            .Select(group =>
            {
                var received = group.Where(x => x.Kind != "refund" && x.Status == "confirmed").Sum(x => x.Amount);
                var refunded = group.Where(x => x.Kind == "refund" && x.Status == "confirmed").Sum(x => x.Amount);
                return (object)new
                {
                    method = group.Key,
                    received,
                    refunded,
                    net = received - refunded,
                    pendingCount = group.Count(x => x.Status == "pending"),
                    confirmedCount = group.Count(x => x.Status == "confirmed")
                };
            })
            .ToList();
    }

    private static async Task<CashSessionSnapshotDto> BuildSnapshot(AppDbContext db, string orgId, CashSession session, CancellationToken ct)
    {
        var invoiceCashIn = await db.InvoicePaymentTransactions.AsNoTracking()
            .Where(x => x.OrganizationId == orgId && x.CashSessionId == session.Id && x.Method == "cash" && x.Status == "confirmed" && x.Kind != "refund")
            .SumAsync(x => x.Amount, ct);

        var invoiceCashOut = await db.InvoicePaymentTransactions.AsNoTracking()
            .Where(x => x.OrganizationId == orgId && x.CashSessionId == session.Id && x.Method == "cash" && x.Status == "confirmed" && x.Kind == "refund")
            .SumAsync(x => x.Amount, ct);

        var manualIn = await db.CashTransactions.AsNoTracking()
            .Where(x => x.OrganizationId == orgId && x.BranchId == session.BranchId && x.CashSessionId == session.Id && x.Type == "in")
            .SumAsync(x => x.Amount, ct);

        var manualOut = await db.CashTransactions.AsNoTracking()
            .Where(x => x.OrganizationId == orgId && x.BranchId == session.BranchId && x.CashSessionId == session.Id && x.Type == "out")
            .SumAsync(x => x.Amount, ct);

        var expected = session.OpeningBalance + invoiceCashIn - invoiceCashOut + manualIn - manualOut;

        return new CashSessionSnapshotDto(
            SessionId: session.Id,
            OpeningBalance: session.OpeningBalance,
            InvoiceCashIn: invoiceCashIn,
            InvoiceCashOut: invoiceCashOut,
            ManualIn: manualIn,
            ManualOut: manualOut,
            ExpectedClosingBalance: expected);
    }

    private static object MapSession(CashSession s) => new
    {
        id = s.Id,
        organizationId = s.OrganizationId,
        branchId = s.BranchId,
        openedByUserId = s.OpenedByUserId,
        closedByUserId = s.ClosedByUserId,
        openingBalance = s.OpeningBalance,
        expectedClosingBalance = s.ExpectedClosingBalance,
        actualClosingBalance = s.ActualClosingBalance,
        discrepancy = s.Discrepancy,
        status = s.Status,
        notes = s.Notes,
        openedAt = s.OpenedAt,
        closedAt = s.ClosedAt,
        createdAt = s.CreatedAt,
        updatedAt = s.UpdatedAt,
        openedBy = (object?)null,
        closedBy = (object?)null
    };

    private static object MapTransaction(CashTransaction t) => new
    {
        id = t.Id,
        organizationId = t.OrganizationId,
        branchId = t.BranchId,
        cashSessionId = t.CashSessionId,
        type = t.Type,
        category = t.Category,
        amount = t.Amount,
        notes = t.Notes,
        createdByUserId = t.CreatedByUserId,
        createdAt = t.CreatedAt,
        createdBy = (object?)null
    };
}
