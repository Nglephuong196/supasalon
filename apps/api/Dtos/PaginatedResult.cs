using Api.Dtos;
namespace Api.Dtos;

public record PaginatedResult<T>(
    IReadOnlyList<T> Data,
    int Total,
    int Page,
    int Limit,
    int TotalPages);
