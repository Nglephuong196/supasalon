using Api.Application.Common.Interfaces.Repositories;
using Api.Application.Common.Models;
using Api.Application.Features.Invoices;
using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Api.Infrastructure.Persistence.Repositories;

public class InvoiceRepository(SalonDbContext db) : IInvoiceRepository
{
    public async Task<PaginatedResult<Invoice>> GetPagedAsync(string organizationId, InvoiceListQuery query, CancellationToken ct = default)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var limit = query.Limit <= 0 ? 20 : query.Limit;

        IQueryable<Invoice> invoices = db.Invoices
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId);

        if (query.IsOpenInTab is bool isOpenInTab)
        {
            invoices = invoices.Where(x => x.IsOpenInTab == isOpenInTab);
        }
        if (query.From is DateTime from)
        {
            invoices = invoices.Where(x => x.CreatedAt >= from);
        }
        if (query.To is DateTime to)
        {
            invoices = invoices.Where(x => x.CreatedAt <= to);
        }
        if (query.BranchId is int branchId)
        {
            invoices = invoices.Where(x => x.BranchId == branchId);
        }

        var total = await invoices.CountAsync(ct);
        var data = await invoices
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(ct);

        var totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)limit));
        return new PaginatedResult<Invoice>(data, total, page, limit, totalPages);
    }

    public Task<Branch?> FindBranchAsync(string organizationId, int branchId, CancellationToken ct = default) =>
        db.Branches.AsNoTracking().FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.Id == branchId, ct);

    public Task<Branch?> FindDefaultBranchAsync(string organizationId, CancellationToken ct = default) =>
        db.Branches.AsNoTracking().FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.IsDefault, ct);

    public Task<Booking?> FindBookingAsync(string organizationId, int bookingId, CancellationToken ct = default) =>
        db.Bookings.AsNoTracking().FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.Id == bookingId, ct);

    public Task<Invoice?> FindByIdAsync(string organizationId, int invoiceId, CancellationToken ct = default) =>
        db.Invoices.FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.Id == invoiceId, ct);

    public Task<int?> FindOpenCashSessionIdAsync(string organizationId, CancellationToken ct = default) =>
        db.CashSessions
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && x.Status == "open")
            .OrderByDescending(x => x.OpenedAt)
            .Select(x => (int?)x.Id)
            .FirstOrDefaultAsync(ct);

    public async Task<InvoicePaymentTransaction> AddPaymentAsync(InvoicePaymentTransaction payment, CancellationToken ct = default)
    {
        db.InvoicePaymentTransactions.Add(payment);
        await db.SaveChangesAsync(ct);
        return payment;
    }

    public Task<List<InvoicePaymentTransaction>> GetConfirmedPaymentsAsync(string organizationId, int invoiceId, CancellationToken ct = default) =>
        db.InvoicePaymentTransactions
            .AsNoTracking()
            .Where(x =>
                x.OrganizationId == organizationId
                && x.InvoiceId == invoiceId
                && x.Status == "confirmed")
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

    public async Task<Invoice> UpdateAsync(Invoice invoice, CancellationToken ct = default)
    {
        db.Invoices.Update(invoice);
        await db.SaveChangesAsync(ct);
        return invoice;
    }

    public async Task<Invoice> AddAsync(Invoice invoice, CancellationToken ct = default)
    {
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync(ct);
        return invoice;
    }
}
