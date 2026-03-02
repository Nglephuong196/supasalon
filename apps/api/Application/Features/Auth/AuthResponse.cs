namespace Api.Application.Features.Auth;

public record AuthResponse(string AccessToken, DateTime ExpiresAtUtc);
