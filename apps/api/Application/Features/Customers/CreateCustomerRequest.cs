namespace Api.Application.Features.Customers;

public record CreateCustomerRequest(
    string OrganizationId,
    string Name,
    string Phone,
    string? Email,
    string? Gender,
    string? Location,
    string? Notes);
