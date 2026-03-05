using Api.Models;
using Api.Dtos;
using System.Linq.Expressions;

namespace Api.Models;

public static class InvoiceMappings
{
    public static readonly Expression<Func<Invoice, InvoiceDto>> ToDtoProjection = invoice =>
        new InvoiceDto(
            invoice.Id,
            invoice.OrganizationId,
            invoice.CustomerId,
            invoice.BookingId,
            invoice.BranchId,
            invoice.Subtotal,
            invoice.DiscountValue,
            invoice.DiscountType,
            invoice.Total,
            invoice.AmountPaid,
            invoice.Change,
            invoice.Status,
            invoice.PaymentMethod,
            invoice.Notes,
            invoice.CreatedAt);

    public static InvoiceDto ToDto(this Invoice invoice) =>
        new(
            invoice.Id,
            invoice.OrganizationId,
            invoice.CustomerId,
            invoice.BookingId,
            invoice.BranchId,
            invoice.Subtotal,
            invoice.DiscountValue,
            invoice.DiscountType,
            invoice.Total,
            invoice.AmountPaid,
            invoice.Change,
            invoice.Status,
            invoice.PaymentMethod,
            invoice.Notes,
            invoice.CreatedAt);

    public static Invoice ToEntity(this CreateInvoiceRequest request, string organizationId) =>
        new()
        {
            OrganizationId = organizationId,
            CustomerId = request.CustomerId,
            BookingId = request.BookingId,
            BranchId = request.BranchId,
            Subtotal = request.Subtotal,
            DiscountValue = request.DiscountValue,
            DiscountType = request.DiscountType ?? "percent",
            Total = request.Total,
            AmountPaid = request.AmountPaid,
            Change = request.Change,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "pending" : request.Status,
            PaymentMethod = request.PaymentMethod,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };
}
