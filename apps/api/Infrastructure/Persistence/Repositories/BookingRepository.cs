using Api.Application.Common.Interfaces.Repositories;
using Api.Application.Common.Models;
using Api.Application.Features.Bookings;
using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Api.Infrastructure.Persistence.Repositories;

public class BookingRepository(SalonDbContext db) : IBookingRepository
{
    public async Task<PaginatedResult<Booking>> GetPagedAsync(string organizationId, BookingListQuery query, CancellationToken ct = default)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var limit = query.Limit <= 0 ? 20 : query.Limit;

        IQueryable<Booking> bookings = db.Bookings
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId);

        if (query.BranchId is int branchId)
        {
            bookings = bookings.Where(x => x.BranchId == branchId);
        }
        if (query.From is DateTime from)
        {
            bookings = bookings.Where(x => x.Date >= from);
        }
        if (query.To is DateTime to)
        {
            bookings = bookings.Where(x => x.Date <= to);
        }
        if (!string.IsNullOrWhiteSpace(query.Status) && !string.Equals(query.Status, "all", StringComparison.OrdinalIgnoreCase))
        {
            bookings = bookings.Where(x => x.Status == query.Status);
        }
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search.Trim()}%";
            bookings = bookings.Where(x => db.Customers
                .Where(c => c.Id == x.CustomerId)
                .Any(c => EF.Functions.ILike(c.Name, pattern) || EF.Functions.ILike(c.Phone, pattern)));
        }

        var total = await bookings.CountAsync(ct);
        var data = await bookings
            .OrderByDescending(x => x.Date)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(ct);

        var totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)limit));
        return new PaginatedResult<Booking>(data, total, page, limit, totalPages);
    }

    public Task<Branch?> FindBranchAsync(string organizationId, int branchId, CancellationToken ct = default) =>
        db.Branches.AsNoTracking().FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.Id == branchId, ct);

    public Task<Branch?> FindDefaultBranchAsync(string organizationId, CancellationToken ct = default) =>
        db.Branches.AsNoTracking().FirstOrDefaultAsync(x => x.OrganizationId == organizationId && x.IsDefault, ct);

    public Task<BookingPolicy?> FindBookingPolicyAsync(string organizationId, CancellationToken ct = default) =>
        db.BookingPolicies.AsNoTracking().FirstOrDefaultAsync(x => x.OrganizationId == organizationId, ct);

    public async Task<Dictionary<int, int>> GetServiceDurationMapAsync(string organizationId, CancellationToken ct = default)
    {
        var rows = await (
            from service in db.Services.AsNoTracking()
            join category in db.ServiceCategories.AsNoTracking()
                on service.CategoryId equals category.Id
            where category.OrganizationId == organizationId
            select new { service.Id, service.Duration }
        ).ToListAsync(ct);

        return rows.ToDictionary(x => x.Id, x => x.Duration);
    }

    public Task<List<Booking>> GetActiveBookingsInRangeAsync(string organizationId, DateTime from, DateTime to, int? excludeBookingId = null, CancellationToken ct = default)
    {
        IQueryable<Booking> query = db.Bookings
            .AsNoTracking()
            .Where(x =>
                x.OrganizationId == organizationId
                && x.Date >= from
                && x.Date <= to
                && (x.Status == "pending" || x.Status == "confirmed" || x.Status == "checkin"));

        if (excludeBookingId is int id)
        {
            query = query.Where(x => x.Id != id);
        }

        return query.ToListAsync(ct);
    }

    public async Task<Booking> AddAsync(Booking booking, CancellationToken ct = default)
    {
        db.Bookings.Add(booking);
        await db.SaveChangesAsync(ct);
        return booking;
    }
}
