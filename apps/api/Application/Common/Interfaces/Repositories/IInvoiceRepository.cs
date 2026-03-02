using Api.Application.Common.Models;
using Api.Application.Features.Invoices;
using Api.Domain.Entities;

namespace Api.Application.Common.Interfaces.Repositories;

public interface IInvoiceRepository
{
    Task<PaginatedResult<Invoice>> GetPagedAsync(string organizationId, InvoiceListQuery query, CancellationToken ct = default);
    Task<Branch?> FindBranchAsync(string organizationId, int branchId, CancellationToken ct = default);
    Task<Branch?> FindDefaultBranchAsync(string organizationId, CancellationToken ct = default);
    Task<Booking?> FindBookingAsync(string organizationId, int bookingId, CancellationToken ct = default);
    Task<Invoice?> FindByIdAsync(string organizationId, int invoiceId, CancellationToken ct = default);
    Task<int?> FindOpenCashSessionIdAsync(string organizationId, CancellationToken ct = default);
    Task<InvoicePaymentTransaction> AddPaymentAsync(InvoicePaymentTransaction payment, CancellationToken ct = default);
    Task<List<InvoicePaymentTransaction>> GetConfirmedPaymentsAsync(string organizationId, int invoiceId, CancellationToken ct = default);
    Task<Invoice> UpdateAsync(Invoice invoice, CancellationToken ct = default);
    Task<Invoice> AddAsync(Invoice invoice, CancellationToken ct = default);
}
