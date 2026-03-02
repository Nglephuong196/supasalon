namespace Api.Dtos;

public record CustomerDto(
    int Id,
    string OrganizationId,
    string Name,
    string? Email,
    string Phone,
    string? Gender,
    string? Location,
    double TotalSpent,
    int? MembershipTierId,
    DateTime CreatedAt);
