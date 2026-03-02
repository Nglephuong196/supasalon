using Api.Application.Common.Interfaces.Repositories;
using Api.Application.Common.Models;
using Api.Application.Features.Customers;
using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Api.Infrastructure.Persistence.Repositories;

public class CustomerRepository(SalonDbContext db) : ICustomerRepository
{
    public async Task<PaginatedResult<Customer>> GetPagedAsync(string organizationId, CustomerListQuery query, CancellationToken ct = default)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var limit = query.Limit <= 0 ? 20 : query.Limit;

        IQueryable<Customer> customers = db.Customers
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search.Trim()}%";
            customers = customers.Where(x =>
                EF.Functions.ILike(x.Name, pattern)
                || (x.Phone != null && EF.Functions.ILike(x.Phone, pattern))
                || (x.Email != null && EF.Functions.ILike(x.Email, pattern)));
        }

        if (query.VipOnly)
        {
            customers = customers.Where(x => x.MembershipTierId != null);
        }

        var total = await customers.CountAsync(ct);
        var data = await customers
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(ct);

        var totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)limit));
        return new PaginatedResult<Customer>(data, total, page, limit, totalPages);
    }

    public async Task<Customer> AddAsync(Customer customer, CancellationToken ct = default)
    {
        db.Customers.Add(customer);
        await db.SaveChangesAsync(ct);
        return customer;
    }
}
