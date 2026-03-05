namespace Api.Models;

public record RegisterRequest(
    string Email,
    string Password,
    string Name,
    string? SalonName,
    string? SalonSlug,
    string? Province,
    string? Address,
    string? Phone);
