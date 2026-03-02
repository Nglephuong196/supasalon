using Api.Application.Common.Models;
using Api.Application.Features.Bookings;

namespace Api.Application.Common.Interfaces.Services;

public interface IBookingService
{
    Task<PaginatedResult<BookingDto>> GetPagedAsync(string organizationId, BookingListQuery query, CancellationToken ct = default);
    Task<BookingDto> CreateAsync(CreateBookingRequest request, CancellationToken ct = default);
}
