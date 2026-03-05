using Api.Data;
using Api.Models;
using Api.Utils;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Api.Endpoints;

public static class BookingRemindersEndpoints
{
    public static IEndpointRouteBuilder MapBookingRemindersEndpoints(this IEndpointRouteBuilder app)
    {
        var reminders = app.MapGroup("/api/booking-reminders").RequireAuthorization();

        reminders.MapGet("/settings", GetSettings);
        reminders.MapPut("/settings", UpdateSettings);
        reminders.MapGet("/logs", ListLogs);
        reminders.MapPost("/send", SendManual);
        reminders.MapPost("/dispatch", DispatchAuto);

        return app;
    }

    private sealed record SettingsPayload(bool? Enabled, Dictionary<string, bool>? Channels, int? HoursBefore, string? Template);
    private sealed record SendPayload(int BookingId, List<string>? Channels, string? Message);

    private static async Task<IResult> GetSettings(HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var orgId = validation.OrganizationId!;
        var entity = await db.BookingReminderSettings.AsNoTracking().FirstOrDefaultAsync(x => x.OrganizationId == orgId, ct);
        if (entity is null)
        {
            return Results.Ok(new
            {
                id = 0,
                organizationId = orgId,
                enabled = false,
                channels = new { sms = false, zalo = false, email = false },
                hoursBefore = 24,
                template = "Nhac lich hen",
                updatedByUserId = (string?)null,
                createdAt = DateTime.UtcNow,
                updatedAt = DateTime.UtcNow
            });
        }

        return Results.Ok(MapSettings(entity));
    }

    private static async Task<IResult> UpdateSettings(SettingsPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var orgId = validation.OrganizationId!;
        var entity = await db.BookingReminderSettings.FirstOrDefaultAsync(x => x.OrganizationId == orgId, ct);
        if (entity is null)
        {
            entity = new BookingReminderSetting
            {
                OrganizationId = orgId,
                Enabled = payload.Enabled ?? false,
                Channels = JsonDocument.Parse(JsonSerializer.Serialize(payload.Channels ?? new Dictionary<string, bool> { ["sms"] = false, ["zalo"] = false, ["email"] = false })),
                HoursBefore = payload.HoursBefore ?? 24,
                Template = payload.Template ?? "Nhac lich hen",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.BookingReminderSettings.Add(entity);
        }
        else
        {
            entity.Enabled = payload.Enabled ?? entity.Enabled;
            if (payload.Channels is not null)
            {
                entity.Channels = JsonDocument.Parse(JsonSerializer.Serialize(payload.Channels));
            }
            entity.HoursBefore = payload.HoursBefore ?? entity.HoursBefore;
            entity.Template = payload.Template ?? entity.Template;
            entity.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Results.Ok(MapSettings(entity));
    }

    private static async Task<IResult> ListLogs(HttpContext httpContext, int? bookingId, string? channel, string? status, DateTime? from, DateTime? to, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var utcFrom = UtcDateTime.EnsureUtc(from);
        var utcTo = UtcDateTime.EnsureUtc(to);

        var query = db.BookingReminderLogs.AsNoTracking().Where(x => x.OrganizationId == validation.OrganizationId);
        if (bookingId is int bid) query = query.Where(x => x.BookingId == bid);
        if (!string.IsNullOrWhiteSpace(channel)) query = query.Where(x => x.Channel == channel);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
        if (utcFrom is DateTime f) query = query.Where(x => x.CreatedAt >= f);
        if (utcTo is DateTime t) query = query.Where(x => x.CreatedAt <= t);

        var rows = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        return Results.Ok(rows.Select(MapLog));
    }

    private static async Task<IResult> SendManual(SendPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var channels = payload.Channels is { Count: > 0 } ? payload.Channels : new List<string> { "sms" };
        var now = DateTime.UtcNow;
        var logs = channels.Select(ch => new BookingReminderLog
        {
            OrganizationId = validation.OrganizationId!,
            BookingId = payload.BookingId,
            Channel = ch,
            Status = "queued",
            ScheduledAt = now,
            Message = payload.Message,
            CreatedAt = now
        }).ToList();

        db.BookingReminderLogs.AddRange(logs);
        await db.SaveChangesAsync(ct);

        return Results.Ok(logs.Select(MapLog));
    }

    private static async Task<IResult> DispatchAuto(HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var rows = await db.BookingReminderLogs
            .Where(x => x.OrganizationId == validation.OrganizationId && x.Status == "queued")
            .OrderBy(x => x.CreatedAt)
            .Take(50)
            .ToListAsync(ct);

        foreach (var row in rows)
        {
            row.Status = "sent";
            row.SentAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);

        return Results.Ok(new
        {
            dispatched = rows.Count,
            logs = rows.Select(MapLog)
        });
    }

    private static object MapSettings(BookingReminderSetting s)
    {
        var channels = s.Channels is null
            ? new Dictionary<string, bool> { ["sms"] = false, ["zalo"] = false, ["email"] = false }
            : JsonSerializer.Deserialize<Dictionary<string, bool>>(s.Channels.RootElement.GetRawText())
              ?? new Dictionary<string, bool> { ["sms"] = false, ["zalo"] = false, ["email"] = false };

        return new
        {
            id = s.Id,
            organizationId = s.OrganizationId,
            enabled = s.Enabled,
            channels = new
            {
                sms = channels.TryGetValue("sms", out var sms) && sms,
                zalo = channels.TryGetValue("zalo", out var zalo) && zalo,
                email = channels.TryGetValue("email", out var email) && email
            },
            hoursBefore = s.HoursBefore,
            template = s.Template,
            updatedByUserId = s.UpdatedByUserId,
            createdAt = s.CreatedAt,
            updatedAt = s.UpdatedAt
        };
    }

    private static object MapLog(BookingReminderLog l) => new
    {
        id = l.Id,
        organizationId = l.OrganizationId,
        bookingId = l.BookingId,
        channel = l.Channel,
        status = l.Status,
        scheduledAt = l.ScheduledAt,
        sentAt = l.SentAt,
        message = l.Message,
        errorMessage = l.ErrorMessage,
        createdAt = l.CreatedAt,
        booking = (object?)null
    };
}
