using Api.Models;
using Api.Dtos;

namespace Api.Interfaces;

public interface IBookingService
{
    Task<PaginatedResult<BookingDto>> GetPagedAsync(string organizationId, BookingListQuery query, CancellationToken ct = default);
    Task<BookingDto> CreateAsync(CreateBookingRequest request, CancellationToken ct = default);
}
