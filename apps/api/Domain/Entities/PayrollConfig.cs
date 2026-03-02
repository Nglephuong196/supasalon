using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("payroll_configs")]
public class PayrollConfig
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("branch_id")]
    public int? BranchId { get; set; }
    [Column("staff_id")]
    public string StaffId { get; set; } = string.Empty;
    [Column("salary_type")]
    public string SalaryType { get; set; } = string.Empty;
    [Column("base_salary")]
    public double BaseSalary { get; set; }
    [Column("default_allowance")]
    public double DefaultAllowance { get; set; }
    [Column("default_deduction")]
    public double DefaultDeduction { get; set; }
    [Column("default_advance")]
    public double DefaultAdvance { get; set; }
    [Column("payment_method")]
    public string PaymentMethod { get; set; } = string.Empty;
    [Column("effective_from")]
    public DateTime EffectiveFrom { get; set; }
    [Column("is_active")]
    public bool IsActive { get; set; }
    [Column("notes")]
    public string? Notes { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

