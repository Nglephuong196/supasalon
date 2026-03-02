using Api.Application.Common.Models;
using Api.Application.Features.Invoices;

namespace Api.Application.Common.Interfaces.Services;

public interface IInvoiceService
{
    Task<PaginatedResult<InvoiceDto>> GetPagedAsync(string organizationId, InvoiceListQuery query, CancellationToken ct = default);
    Task<InvoiceDto> CreateAsync(CreateInvoiceRequest request, CancellationToken ct = default);
}
