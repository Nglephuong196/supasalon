using System.Text.Json;

namespace Api.Application.Features.Bookings;

public record CreateBookingRequest(
    string OrganizationId,
    int CustomerId,
    int? BranchId,
    DateTime Date,
    string? Status,
    double? DepositAmount,
    double? DepositPaid,
    int? GuestCount,
    string? Notes,
    JsonDocument? Guests);
