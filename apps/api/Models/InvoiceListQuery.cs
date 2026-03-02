namespace Api.Models;

public record InvoiceListQuery(
    bool? IsOpenInTab = null,
    DateTime? From = null,
    DateTime? To = null,
    int? BranchId = null,
    int Page = 1,
    int Limit = 20);
