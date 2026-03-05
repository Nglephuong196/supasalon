namespace Api.Dtos;

public record RegisterResponse(
    string AccessToken,
    DateTime ExpiresAtUtc,
    string OrganizationId,
    int BranchId);
