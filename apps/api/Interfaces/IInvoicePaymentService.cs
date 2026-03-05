using Api.Models;
using Api.Dtos;

namespace Api.Interfaces;

public interface IInvoicePaymentService
{
    Task<InvoiceDto> RecordPaymentAsync(string organizationId, int invoiceId, RecordInvoicePaymentRequest request, CancellationToken ct = default);
}
