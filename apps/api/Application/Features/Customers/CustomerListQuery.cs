namespace Api.Application.Features.Customers;

public record CustomerListQuery(
    int Page = 1,
    int Limit = 20,
    string? Search = null,
    bool VipOnly = false);
