using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Models;

[Table("cash_sessions")]
public class CashSession
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("opened_by_user_id")]
    public string? OpenedByUserId { get; set; }
    [Column("closed_by_user_id")]
    public string? ClosedByUserId { get; set; }
    [Column("opening_balance")]
    public double OpeningBalance { get; set; }
    [Column("expected_closing_balance")]
    public double ExpectedClosingBalance { get; set; }
    [Column("actual_closing_balance")]
    public double? ActualClosingBalance { get; set; }
    [Column("discrepancy")]
    public double? Discrepancy { get; set; }
    [Column("status")]
    public string Status { get; set; } = string.Empty;
    [Column("notes")]
    public string? Notes { get; set; }
    [Column("opened_at")]
    public DateTime OpenedAt { get; set; }
    [Column("closed_at")]
    public DateTime? ClosedAt { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

