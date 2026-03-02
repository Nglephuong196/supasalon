using Api.Models;
using Api.Dtos;

namespace Api.Interfaces;

public interface ICustomerRepository
{
    Task<PaginatedResult<Customer>> GetPagedAsync(string organizationId, CustomerListQuery query, CancellationToken ct = default);
    Task<Customer> AddAsync(Customer customer, CancellationToken ct = default);
}
