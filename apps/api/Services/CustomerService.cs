using Api.Interfaces;
using Api.Dtos;
using Api.Models;

namespace Api.Services;

public class CustomerService(ICustomerRepository repository) : ICustomerService
{
    public async Task<PaginatedResult<CustomerDto>> GetPagedAsync(string organizationId, CustomerListQuery query, CancellationToken ct = default)
    {
        var result = await repository.GetPagedAsync(organizationId, query, ct);
        return new PaginatedResult<CustomerDto>(
            result.Data.Select(x => x.ToDto()).ToList(),
            result.Total,
            result.Page,
            result.Limit,
            result.TotalPages);
    }

    public async Task<CustomerDto> CreateAsync(string organizationId, CreateCustomerRequest request, CancellationToken ct = default)
    {
        var entity = request.ToEntity(organizationId);
        var created = await repository.AddAsync(entity, ct);
        return created.ToDto();
    }
}
