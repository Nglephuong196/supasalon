namespace Api.Application.Features.Invoices;

public record InvoiceListQuery(
    bool? IsOpenInTab = null,
    DateTime? From = null,
    DateTime? To = null,
    int? BranchId = null,
    int Page = 1,
    int Limit = 20);
