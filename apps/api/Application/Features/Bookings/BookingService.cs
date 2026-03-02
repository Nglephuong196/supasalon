using Api.Application.Common.Interfaces.Repositories;
using Api.Application.Common.Interfaces.Services;
using Api.Application.Common.Models;

namespace Api.Application.Features.Bookings;

public class BookingService(IBookingRepository repository, IBookingConflictService conflictService) : IBookingService
{
    public async Task<PaginatedResult<BookingDto>> GetPagedAsync(string organizationId, BookingListQuery query, CancellationToken ct = default)
    {
        var result = await repository.GetPagedAsync(organizationId, query, ct);
        return new PaginatedResult<BookingDto>(
            result.Data.Select(x => x.ToDto()).ToList(),
            result.Total,
            result.Page,
            result.Limit,
            result.TotalPages);
    }

    public async Task<BookingDto> CreateAsync(CreateBookingRequest request, CancellationToken ct = default)
    {
        var entity = request.ToEntity();
        var policy = await repository.FindBookingPolicyAsync(entity.OrganizationId, ct);

        if (policy?.RequireDeposit == true && entity.DepositAmount <= 0)
        {
            entity.DepositAmount = policy.DefaultDepositAmount;
        }
        if (entity.DepositAmount < 0 || entity.DepositPaid < 0)
        {
            throw new InvalidOperationException("Thong tin dat coc khong hop le");
        }
        if (entity.DepositPaid > entity.DepositAmount)
        {
            throw new InvalidOperationException("So tien da coc khong the lon hon so tien can coc");
        }

        if (entity.BranchId is int branchId)
        {
            var found = await repository.FindBranchAsync(entity.OrganizationId, branchId, ct);
            if (found is null)
            {
                throw new InvalidOperationException("Chi nhanh khong hop le");
            }
        }
        else
        {
            var defaultBranch = await repository.FindDefaultBranchAsync(entity.OrganizationId, ct);
            entity.BranchId = defaultBranch?.Id;
        }

        if (IsActiveStatus(entity.Status))
        {
            await conflictService.EnsureNoStaffConflictsAsync(entity.OrganizationId, entity.Date, entity.Guests, null, ct);
        }

        var created = await repository.AddAsync(entity, ct);
        return created.ToDto();
    }

    private static bool IsActiveStatus(string? status) =>
        status is "pending" or "confirmed" or "checkin";
}
