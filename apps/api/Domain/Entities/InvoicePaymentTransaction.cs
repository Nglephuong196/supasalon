using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("invoice_payment_transactions")]
public class InvoicePaymentTransaction
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("invoice_id")]
    public int InvoiceId { get; set; }
    [Column("cash_session_id")]
    public int? CashSessionId { get; set; }
    [Column("kind")]
    public string Kind { get; set; } = string.Empty;
    [Column("method")]
    public string Method { get; set; } = string.Empty;
    [Column("status")]
    public string Status { get; set; } = string.Empty;
    [Column("amount")]
    public double Amount { get; set; }
    [Column("reference_code")]
    public string? ReferenceCode { get; set; }
    [Column("notes")]
    public string? Notes { get; set; }
    [Column("created_by_user_id")]
    public string? CreatedByUserId { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    [Column("confirmed_at")]
    public DateTime? ConfirmedAt { get; set; }
}

