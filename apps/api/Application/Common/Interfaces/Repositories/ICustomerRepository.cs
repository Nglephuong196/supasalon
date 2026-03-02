using Api.Application.Common.Models;
using Api.Application.Features.Customers;
using Api.Domain.Entities;

namespace Api.Application.Common.Interfaces.Repositories;

public interface ICustomerRepository
{
    Task<PaginatedResult<Customer>> GetPagedAsync(string organizationId, CustomerListQuery query, CancellationToken ct = default);
    Task<Customer> AddAsync(Customer customer, CancellationToken ct = default);
}
