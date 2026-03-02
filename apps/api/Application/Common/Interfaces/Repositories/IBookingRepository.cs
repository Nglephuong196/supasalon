using Api.Application.Common.Models;
using Api.Application.Features.Bookings;
using Api.Domain.Entities;

namespace Api.Application.Common.Interfaces.Repositories;

public interface IBookingRepository
{
    Task<PaginatedResult<Booking>> GetPagedAsync(string organizationId, BookingListQuery query, CancellationToken ct = default);
    Task<Branch?> FindBranchAsync(string organizationId, int branchId, CancellationToken ct = default);
    Task<Branch?> FindDefaultBranchAsync(string organizationId, CancellationToken ct = default);
    Task<BookingPolicy?> FindBookingPolicyAsync(string organizationId, CancellationToken ct = default);
    Task<Dictionary<int, int>> GetServiceDurationMapAsync(string organizationId, CancellationToken ct = default);
    Task<List<Booking>> GetActiveBookingsInRangeAsync(string organizationId, DateTime from, DateTime to, int? excludeBookingId = null, CancellationToken ct = default);
    Task<Booking> AddAsync(Booking booking, CancellationToken ct = default);
}
