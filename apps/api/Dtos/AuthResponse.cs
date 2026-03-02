namespace Api.Dtos;

public record AuthResponse(string AccessToken, DateTime ExpiresAtUtc);
