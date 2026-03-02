namespace Api.Models;

public record CreateInvoiceRequest(
    string OrganizationId,
    int? CustomerId,
    int? BookingId,
    int? BranchId,
    double Subtotal,
    double? DiscountValue,
    string? DiscountType,
    double Total,
    double? AmountPaid,
    double? Change,
    string? Status,
    string? PaymentMethod,
    string? Notes);
