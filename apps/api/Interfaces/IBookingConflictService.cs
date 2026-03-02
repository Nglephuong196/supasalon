namespace Api.Interfaces;

public interface IBookingConflictService
{
    Task EnsureNoStaffConflictsAsync(string organizationId, DateTime bookingDate, System.Text.Json.JsonDocument? guests, int? excludeBookingId = null, CancellationToken ct = default);
}
