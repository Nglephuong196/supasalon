namespace Api.Application.Common.Models;

public record PaginatedResult<T>(
    IReadOnlyList<T> Data,
    int Total,
    int Page,
    int Limit,
    int TotalPages);
