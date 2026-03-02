using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Models;

[Table("payroll_items")]
public class PayrollItem
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("cycle_id")]
    public int CycleId { get; set; }
    [Column("staff_id")]
    public string StaffId { get; set; } = string.Empty;
    [Column("branch_id")]
    public int? BranchId { get; set; }
    [Column("base_salary")]
    public double BaseSalary { get; set; }
    [Column("commission_amount")]
    public double CommissionAmount { get; set; }
    [Column("bonus_amount")]
    public double BonusAmount { get; set; }
    [Column("allowance_amount")]
    public double AllowanceAmount { get; set; }
    [Column("deduction_amount")]
    public double DeductionAmount { get; set; }
    [Column("advance_amount")]
    public double AdvanceAmount { get; set; }
    [Column("net_amount")]
    public double NetAmount { get; set; }
    [Column("payment_method")]
    public string PaymentMethod { get; set; } = string.Empty;
    [Column("status")]
    public string Status { get; set; } = string.Empty;
    [Column("paid_at")]
    public DateTime? PaidAt { get; set; }
    [Column("notes")]
    public string? Notes { get; set; }
    [Column("metadata", TypeName = "jsonb")]
    public JsonDocument? Metadata { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

