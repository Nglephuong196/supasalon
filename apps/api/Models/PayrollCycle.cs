using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Models;

[Table("payroll_cycles")]
public class PayrollCycle
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("branch_id")]
    public int? BranchId { get; set; }
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    [Column("from_date")]
    public DateTime FromDate { get; set; }
    [Column("to_date")]
    public DateTime ToDate { get; set; }
    [Column("status")]
    public string Status { get; set; } = string.Empty;
    [Column("notes")]
    public string? Notes { get; set; }
    [Column("created_by_user_id")]
    public string? CreatedByUserId { get; set; }
    [Column("finalized_by_user_id")]
    public string? FinalizedByUserId { get; set; }
    [Column("paid_by_user_id")]
    public string? PaidByUserId { get; set; }
    [Column("finalized_at")]
    public DateTime? FinalizedAt { get; set; }
    [Column("paid_at")]
    public DateTime? PaidAt { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

