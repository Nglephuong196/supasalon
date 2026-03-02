using Api.Application.Common.Models;
using Api.Application.Features.Customers;

namespace Api.Application.Common.Interfaces.Services;

public interface ICustomerService
{
    Task<PaginatedResult<CustomerDto>> GetPagedAsync(string organizationId, CustomerListQuery query, CancellationToken ct = default);
    Task<CustomerDto> CreateAsync(CreateCustomerRequest request, CancellationToken ct = default);
}
