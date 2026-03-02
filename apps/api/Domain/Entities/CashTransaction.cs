using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("cash_transactions")]
public class CashTransaction
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("cash_session_id")]
    public int? CashSessionId { get; set; }
    [Column("type")]
    public string Type { get; set; } = string.Empty;
    [Column("category")]
    public string Category { get; set; } = string.Empty;
    [Column("amount")]
    public double Amount { get; set; }
    [Column("notes")]
    public string? Notes { get; set; }
    [Column("created_by_user_id")]
    public string? CreatedByUserId { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

