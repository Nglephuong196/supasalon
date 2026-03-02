namespace Api.Application.Features.Invoices;

public record RecordInvoicePaymentRequest(
    string OrganizationId,
    string Method,
    double Amount,
    string? Status = null,
    string? Kind = null,
    string? ReferenceCode = null,
    string? Notes = null,
    string? CreatedByUserId = null);
