using Api.Models;
using Api.Dtos;

namespace Api.Interfaces;

public interface IInvoiceService
{
    Task<PaginatedResult<InvoiceDto>> GetPagedAsync(string organizationId, InvoiceListQuery query, CancellationToken ct = default);
    Task<InvoiceDto> CreateAsync(string organizationId, CreateInvoiceRequest request, CancellationToken ct = default);
}
