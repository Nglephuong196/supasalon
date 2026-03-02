namespace Api.Application.Features.Auth;

public record RegisterRequest(string Email, string Password, string Name);
