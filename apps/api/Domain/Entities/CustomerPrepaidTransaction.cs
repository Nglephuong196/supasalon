using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("customer_prepaid_transactions")]
public class CustomerPrepaidTransaction
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("card_id")]
    public int CardId { get; set; }
    [Column("customer_id")]
    public int CustomerId { get; set; }
    [Column("invoice_id")]
    public int? InvoiceId { get; set; }
    [Column("type")]
    public string Type { get; set; } = string.Empty;
    [Column("amount")]
    public double Amount { get; set; }
    [Column("balance_after")]
    public double BalanceAfter { get; set; }
    [Column("notes")]
    public string? Notes { get; set; }
    [Column("metadata", TypeName = "jsonb")]
    public JsonDocument? Metadata { get; set; }
    [Column("created_by_user_id")]
    public string? CreatedByUserId { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

