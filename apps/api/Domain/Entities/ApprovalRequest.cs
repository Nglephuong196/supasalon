using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("approval_requests")]
public class ApprovalRequest
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("entity_type")]
    public string EntityType { get; set; } = string.Empty;
    [Column("entity_id")]
    public int? EntityId { get; set; }
    [Column("action")]
    public string Action { get; set; } = string.Empty;
    [Column("payload", TypeName = "jsonb")]
    public JsonDocument? Payload { get; set; }
    [Column("status")]
    public string Status { get; set; } = string.Empty;
    [Column("request_reason")]
    public string? RequestReason { get; set; }
    [Column("review_reason")]
    public string? ReviewReason { get; set; }
    [Column("requested_by_user_id")]
    public string? RequestedByUserId { get; set; }
    [Column("reviewed_by_user_id")]
    public string? ReviewedByUserId { get; set; }
    [Column("reviewed_at")]
    public DateTime? ReviewedAt { get; set; }
    [Column("expires_at")]
    public DateTime? ExpiresAt { get; set; }
    [Column("executed_at")]
    public DateTime? ExecutedAt { get; set; }
    [Column("execution_result", TypeName = "jsonb")]
    public JsonDocument? ExecutionResult { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

