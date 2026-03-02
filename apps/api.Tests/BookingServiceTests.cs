using Api.Application.Common.Interfaces.Repositories;
using Api.Application.Common.Interfaces.Services;
using Api.Application.Common.Models;
using Api.Application.Features.Bookings;
using Api.Domain.Entities;
using System.Text.Json;

namespace api.Tests;

public class BookingServiceTests
{
    [Fact]
    public async Task CreateAsync_AppliesDefaultDeposit_FromPolicy()
    {
        var repo = new FakeBookingRepository
        {
            Policy = new BookingPolicy
            {
                OrganizationId = "org-1",
                RequireDeposit = true,
                DefaultDepositAmount = 100
            },
            DefaultBranch = new Branch { Id = 2, OrganizationId = "org-1", IsDefault = true }
        };
        var conflict = new FakeBookingConflictService();
        var service = new BookingService(repo, conflict);

        var request = new CreateBookingRequest(
            OrganizationId: "org-1",
            CustomerId: 10,
            BranchId: null,
            Date: DateTime.UtcNow,
            Status: "pending",
            DepositAmount: 0,
            DepositPaid: 0,
            GuestCount: 1,
            Notes: null,
            Guests: JsonDocument.Parse("[]"));

        var result = await service.CreateAsync(request);

        Assert.Equal(100, result.DepositAmount);
        Assert.NotNull(repo.LastAdded);
        Assert.Equal(100, repo.LastAdded!.DepositAmount);
        Assert.Equal(2, repo.LastAdded.BranchId);
    }

    [Fact]
    public async Task CreateAsync_Throws_When_BranchIsInvalid()
    {
        var repo = new FakeBookingRepository
        {
            Policy = new BookingPolicy { OrganizationId = "org-1" }
        };
        var conflict = new FakeBookingConflictService();
        var service = new BookingService(repo, conflict);

        var request = new CreateBookingRequest(
            OrganizationId: "org-1",
            CustomerId: 10,
            BranchId: 99,
            Date: DateTime.UtcNow,
            Status: "pending",
            DepositAmount: 0,
            DepositPaid: 0,
            GuestCount: 1,
            Notes: null,
            Guests: null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(request));
    }

    [Fact]
    public async Task CreateAsync_CallsConflictCheck_ForActiveStatus()
    {
        var repo = new FakeBookingRepository
        {
            Policy = new BookingPolicy { OrganizationId = "org-1" },
            DefaultBranch = new Branch { Id = 1, OrganizationId = "org-1", IsDefault = true }
        };
        var conflict = new FakeBookingConflictService();
        var service = new BookingService(repo, conflict);

        var request = new CreateBookingRequest(
            OrganizationId: "org-1",
            CustomerId: 10,
            BranchId: null,
            Date: DateTime.UtcNow,
            Status: "confirmed",
            DepositAmount: 0,
            DepositPaid: 0,
            GuestCount: 1,
            Notes: null,
            Guests: null);

        await service.CreateAsync(request);

        Assert.True(conflict.Called);
    }

    private sealed class FakeBookingConflictService : IBookingConflictService
    {
        public bool Called { get; private set; }

        public Task EnsureNoStaffConflictsAsync(string organizationId, DateTime bookingDate, JsonDocument? guests, int? excludeBookingId = null, CancellationToken ct = default)
        {
            Called = true;
            return Task.CompletedTask;
        }
    }

    private sealed class FakeBookingRepository : IBookingRepository
    {
        public Branch? DefaultBranch { get; init; }
        public BookingPolicy? Policy { get; init; }
        public Booking? LastAdded { get; private set; }
        public Branch? ExplicitBranch { get; init; }

        public Task<Booking> AddAsync(Booking booking, CancellationToken ct = default)
        {
            booking.Id = 123;
            LastAdded = booking;
            return Task.FromResult(booking);
        }

        public Task<Branch?> FindBranchAsync(string organizationId, int branchId, CancellationToken ct = default)
            => Task.FromResult(ExplicitBranch is { Id: var id } && id == branchId ? ExplicitBranch : null);

        public Task<BookingPolicy?> FindBookingPolicyAsync(string organizationId, CancellationToken ct = default)
            => Task.FromResult(Policy);

        public Task<Branch?> FindDefaultBranchAsync(string organizationId, CancellationToken ct = default)
            => Task.FromResult(DefaultBranch);

        public Task<PaginatedResult<Booking>> GetPagedAsync(string organizationId, BookingListQuery query, CancellationToken ct = default)
            => Task.FromResult(new PaginatedResult<Booking>(new List<Booking>(), 0, 1, 20, 1));

        public Task<List<Booking>> GetActiveBookingsInRangeAsync(string organizationId, DateTime from, DateTime to, int? excludeBookingId = null, CancellationToken ct = default)
            => Task.FromResult(new List<Booking>());

        public Task<Dictionary<int, int>> GetServiceDurationMapAsync(string organizationId, CancellationToken ct = default)
            => Task.FromResult(new Dictionary<int, int>());
    }
}
