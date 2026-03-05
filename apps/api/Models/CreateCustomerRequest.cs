namespace Api.Models;

public record CreateCustomerRequest(
    string Name,
    string Phone,
    string? Email,
    string? Gender,
    string? Location,
    string? Notes);
