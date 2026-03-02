namespace Api.Application.Features.Bookings;

public record BookingListQuery(
    int? BranchId = null,
    DateTime? From = null,
    DateTime? To = null,
    string? Status = null,
    string? Search = null,
    int Page = 1,
    int Limit = 20);
