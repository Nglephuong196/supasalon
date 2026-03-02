using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Models;

[Table("booking_reminder_logs")]
public class BookingReminderLog
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("booking_id")]
    public int BookingId { get; set; }
    [Column("channel")]
    public string Channel { get; set; } = string.Empty;
    [Column("status")]
    public string Status { get; set; } = string.Empty;
    [Column("scheduled_at")]
    public DateTime ScheduledAt { get; set; }
    [Column("sent_at")]
    public DateTime? SentAt { get; set; }
    [Column("message")]
    public string? Message { get; set; }
    [Column("error_message")]
    public string? ErrorMessage { get; set; }
    [Column("payload", TypeName = "jsonb")]
    public JsonDocument? Payload { get; set; }
    [Column("created_by_user_id")]
    public string? CreatedByUserId { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

