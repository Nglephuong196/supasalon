using Api.Models;
using Api.Dtos;

namespace Api.Interfaces;

public interface ICustomerService
{
    Task<PaginatedResult<CustomerDto>> GetPagedAsync(string organizationId, CustomerListQuery query, CancellationToken ct = default);
    Task<CustomerDto> CreateAsync(string organizationId, CreateCustomerRequest request, CancellationToken ct = default);
}
