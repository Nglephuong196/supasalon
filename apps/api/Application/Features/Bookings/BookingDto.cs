using System.Text.Json;

namespace Api.Application.Features.Bookings;

public record BookingDto(
    int Id,
    string OrganizationId,
    int CustomerId,
    int? BranchId,
    DateTime Date,
    string Status,
    double DepositAmount,
    double DepositPaid,
    int GuestCount,
    string? Notes,
    JsonDocument? Guests,
    DateTime CreatedAt);
