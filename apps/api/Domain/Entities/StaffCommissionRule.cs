using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("staff_commission_rules")]
public class StaffCommissionRule
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("staff_id")]
    public string StaffId { get; set; } = string.Empty;
    [Column("item_type")]
    public string ItemType { get; set; } = string.Empty;
    [Column("item_id")]
    public int ItemId { get; set; }
    [Column("commission_type")]
    public string CommissionType { get; set; } = string.Empty;
    [Column("commission_value")]
    public double CommissionValue { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

