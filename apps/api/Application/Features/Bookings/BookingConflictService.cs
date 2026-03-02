using Api.Application.Common.Interfaces.Repositories;
using Api.Application.Common.Interfaces.Services;
using Api.Domain.Entities;
using System.Text.Json;

namespace Api.Application.Features.Bookings;

public class BookingConflictService(IBookingRepository repository) : IBookingConflictService
{
    public async Task EnsureNoStaffConflictsAsync(string organizationId, DateTime bookingDate, JsonDocument? guests, int? excludeBookingId = null, CancellationToken ct = default)
    {
        var policy = await repository.FindBookingPolicyAsync(organizationId, ct);
        if (policy is not null && !policy.PreventStaffOverlap)
        {
            return;
        }

        var assignedStaffIds = GetAssignedStaffIds(guests);
        if (assignedStaffIds.Count == 0)
        {
            return;
        }

        var serviceDurationMap = await repository.GetServiceDurationMapAsync(organizationId, ct);
        var requestedDuration = GetBookingDurationMinutes(guests, serviceDurationMap);
        var requestedStart = bookingDate;
        var requestedEnd = requestedStart.AddMinutes(requestedDuration);
        var bufferMinutes = Math.Max(0, policy?.BufferMinutes ?? 0);
        var requestedWindowStart = requestedStart.AddMinutes(-bufferMinutes);
        var requestedWindowEnd = requestedEnd.AddMinutes(bufferMinutes);

        var windowFrom = requestedStart.AddDays(-1);
        var windowTo = requestedEnd.AddDays(1);
        var candidates = await repository.GetActiveBookingsInRangeAsync(organizationId, windowFrom, windowTo, excludeBookingId, ct);

        foreach (var candidate in candidates)
        {
            var candidateStaffIds = GetAssignedStaffIds(candidate.Guests);
            var hasSharedStaff = candidateStaffIds.Any(assignedStaffIds.Contains);
            if (!hasSharedStaff)
            {
                continue;
            }

            var candidateDuration = GetBookingDurationMinutes(candidate.Guests, serviceDurationMap);
            var candidateStart = candidate.Date;
            var candidateEnd = candidateStart.AddMinutes(candidateDuration);
            var candidateWindowStart = candidateStart.AddMinutes(-bufferMinutes);
            var candidateWindowEnd = candidateEnd.AddMinutes(bufferMinutes);

            var overlaps = requestedWindowStart < candidateWindowEnd && requestedWindowEnd > candidateWindowStart;
            if (overlaps)
            {
                throw new InvalidOperationException($"Nhan vien da co lich trung khung gio (booking #{candidate.Id})");
            }
        }
    }

    private static HashSet<string> GetAssignedStaffIds(JsonDocument? guests)
    {
        var ids = new HashSet<string>(StringComparer.Ordinal);
        if (guests is null || guests.RootElement.ValueKind != JsonValueKind.Array)
        {
            return ids;
        }

        foreach (var guest in guests.RootElement.EnumerateArray())
        {
            if (!guest.TryGetProperty("services", out var services) || services.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            foreach (var service in services.EnumerateArray())
            {
                if (service.TryGetProperty("memberId", out var memberIdElement))
                {
                    var memberId = memberIdElement.GetString();
                    if (!string.IsNullOrWhiteSpace(memberId))
                    {
                        ids.Add(memberId.Trim());
                    }
                }
            }
        }

        return ids;
    }

    private static int GetBookingDurationMinutes(JsonDocument? guests, IReadOnlyDictionary<int, int> serviceDurationMap)
    {
        if (guests is null || guests.RootElement.ValueKind != JsonValueKind.Array)
        {
            return 30;
        }

        var maxDuration = 0;
        foreach (var guest in guests.RootElement.EnumerateArray())
        {
            if (!guest.TryGetProperty("services", out var services) || services.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            var guestDuration = 0;
            foreach (var service in services.EnumerateArray())
            {
                if (!service.TryGetProperty("serviceId", out var serviceIdElement))
                {
                    continue;
                }

                var serviceId = serviceIdElement.ValueKind == JsonValueKind.Number
                    ? serviceIdElement.GetInt32()
                    : int.TryParse(serviceIdElement.GetString(), out var parsed) ? parsed : 0;

                if (serviceId != 0 && serviceDurationMap.TryGetValue(serviceId, out var duration))
                {
                    guestDuration += duration;
                }
            }

            maxDuration = Math.Max(maxDuration, guestDuration);
        }

        return maxDuration > 0 ? maxDuration : 30;
    }
}
