using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Models;

[Table("invoices")]
public class Invoice
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("customer_id")]
    public int? CustomerId { get; set; }
    [Column("booking_id")]
    public int? BookingId { get; set; }
    [Column("branch_id")]
    public int? BranchId { get; set; }
    [Column("subtotal")]
    public double Subtotal { get; set; }
    [Column("discount_value")]
    public double? DiscountValue { get; set; }
    [Column("discount_type")]
    public string? DiscountType { get; set; }
    [Column("total")]
    public double Total { get; set; }
    [Column("amount_paid")]
    public double? AmountPaid { get; set; }
    [Column("change")]
    public double? Change { get; set; }
    [Column("status")]
    public string Status { get; set; } = string.Empty;
    [Column("payment_method")]
    public string? PaymentMethod { get; set; }
    [Column("notes")]
    public string? Notes { get; set; }
    [Column("paid_at")]
    public DateTime? PaidAt { get; set; }
    [Column("cancel_reason")]
    public string? CancelReason { get; set; }
    [Column("cancelled_at")]
    public DateTime? CancelledAt { get; set; }
    [Column("refund_reason")]
    public string? RefundReason { get; set; }
    [Column("refunded_at")]
    public DateTime? RefundedAt { get; set; }
    [Column("is_open_in_tab")]
    public bool? IsOpenInTab { get; set; }
    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

