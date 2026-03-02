using Api.Application.Common.Interfaces.Repositories;
using Api.Application.Common.Interfaces.Services;
using Api.Application.Common.Models;

namespace Api.Application.Features.Invoices;

public class InvoiceService(IInvoiceRepository repository) : IInvoiceService
{
    public async Task<PaginatedResult<InvoiceDto>> GetPagedAsync(string organizationId, InvoiceListQuery query, CancellationToken ct = default)
    {
        var result = await repository.GetPagedAsync(organizationId, query, ct);
        return new PaginatedResult<InvoiceDto>(
            result.Data.Select(x => x.ToDto()).ToList(),
            result.Total,
            result.Page,
            result.Limit,
            result.TotalPages);
    }

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceRequest request, CancellationToken ct = default)
    {
        var entity = request.ToEntity();

        if (entity.BranchId is int branchId)
        {
            var found = await repository.FindBranchAsync(entity.OrganizationId, branchId, ct);
            if (found is null)
            {
                throw new InvalidOperationException("Chi nhanh khong hop le");
            }
        }
        else if (entity.BookingId is int bookingId)
        {
            var booking = await repository.FindBookingAsync(entity.OrganizationId, bookingId, ct);
            if (booking?.BranchId is int linkedBranchId)
            {
                entity.BranchId = linkedBranchId;
            }
        }

        if (entity.BranchId is null)
        {
            var defaultBranch = await repository.FindDefaultBranchAsync(entity.OrganizationId, ct);
            entity.BranchId = defaultBranch?.Id;
        }

        var created = await repository.AddAsync(entity, ct);
        return created.ToDto();
    }
}
