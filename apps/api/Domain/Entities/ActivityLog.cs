using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("activity_logs")]
public class ActivityLog
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("actor_user_id")]
    public string? ActorUserId { get; set; }
    [Column("entity_type")]
    public string EntityType { get; set; } = string.Empty;
    [Column("entity_id")]
    public int? EntityId { get; set; }
    [Column("action")]
    public string Action { get; set; } = string.Empty;
    [Column("reason")]
    public string? Reason { get; set; }
    [Column("metadata", TypeName = "jsonb")]
    public JsonDocument? Metadata { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

