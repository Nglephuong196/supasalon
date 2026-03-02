using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("customer_prepaid_cards")]
public class CustomerPrepaidCard
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("customer_id")]
    public int CustomerId { get; set; }
    [Column("plan_id")]
    public int? PlanId { get; set; }
    [Column("card_code")]
    public string CardCode { get; set; } = string.Empty;
    [Column("unit")]
    public string Unit { get; set; } = string.Empty;
    [Column("purchase_price")]
    public double PurchasePrice { get; set; }
    [Column("initial_balance")]
    public double InitialBalance { get; set; }
    [Column("remaining_balance")]
    public double RemainingBalance { get; set; }
    [Column("status")]
    public string Status { get; set; } = string.Empty;
    [Column("notes")]
    public string? Notes { get; set; }
    [Column("purchased_at")]
    public DateTime PurchasedAt { get; set; }
    [Column("expired_at")]
    public DateTime? ExpiredAt { get; set; }
    [Column("created_by_user_id")]
    public string? CreatedByUserId { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

