namespace Api.Models;

public record RecordInvoicePaymentRequest(
    string Method,
    double Amount,
    string? Status = null,
    string? Kind = null,
    string? ReferenceCode = null,
    string? Notes = null,
    string? CreatedByUserId = null);
