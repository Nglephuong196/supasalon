using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("staff_commission_payouts")]
public class StaffCommissionPayout
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("staff_id")]
    public string StaffId { get; set; } = string.Empty;
    [Column("from_date")]
    public DateTime FromDate { get; set; }
    [Column("to_date")]
    public DateTime ToDate { get; set; }
    [Column("total_amount")]
    public double TotalAmount { get; set; }
    [Column("status")]
    public string Status { get; set; } = string.Empty;
    [Column("notes")]
    public string? Notes { get; set; }
    [Column("paid_at")]
    public DateTime? PaidAt { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

