using Api.Models;
using Api.Dtos;

namespace Api.Interfaces;

public interface IInvoicePaymentService
{
    Task<InvoiceDto> RecordPaymentAsync(int invoiceId, RecordInvoicePaymentRequest request, CancellationToken ct = default);
}
