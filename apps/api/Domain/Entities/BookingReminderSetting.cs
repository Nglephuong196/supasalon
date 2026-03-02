using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("booking_reminder_settings")]
public class BookingReminderSetting
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("enabled")]
    public bool Enabled { get; set; }
    [Column("channels", TypeName = "jsonb")]
    public JsonDocument? Channels { get; set; }
    [Column("hours_before")]
    public int HoursBefore { get; set; }
    [Column("template")]
    public string Template { get; set; } = string.Empty;
    [Column("updated_by_user_id")]
    public string? UpdatedByUserId { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

