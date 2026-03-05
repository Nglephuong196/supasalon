using System.Text.Json;

namespace Api.Models;

public record CreateBookingRequest(
    int CustomerId,
    int? BranchId,
    DateTime Date,
    string? Status,
    double? DepositAmount,
    double? DepositPaid,
    int? GuestCount,
    string? Notes,
    JsonDocument? Guests);
