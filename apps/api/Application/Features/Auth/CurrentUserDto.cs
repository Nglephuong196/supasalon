namespace Api.Application.Features.Auth;

public record CurrentUserDto(
    string Id,
    string? Email,
    string Name,
    string? Image,
    DateTime CreatedAt,
    DateTime UpdatedAt);
