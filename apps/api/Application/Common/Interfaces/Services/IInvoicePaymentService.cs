using Api.Application.Features.Invoices;

namespace Api.Application.Common.Interfaces.Services;

public interface IInvoicePaymentService
{
    Task<InvoiceDto> RecordPaymentAsync(int invoiceId, RecordInvoicePaymentRequest request, CancellationToken ct = default);
}
