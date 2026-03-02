using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Models;

[Table("prepaid_plans")]
public class PrepaidPlan
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    [Column("description")]
    public string? Description { get; set; }
    [Column("unit")]
    public string Unit { get; set; } = string.Empty;
    [Column("sale_price")]
    public double SalePrice { get; set; }
    [Column("initial_balance")]
    public double InitialBalance { get; set; }
    [Column("expiry_days")]
    public int ExpiryDays { get; set; }
    [Column("is_active")]
    public bool IsActive { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

