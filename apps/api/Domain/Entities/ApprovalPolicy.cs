using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("approval_policies")]
public class ApprovalPolicy
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("require_invoice_cancel_approval")]
    public bool RequireInvoiceCancelApproval { get; set; }
    [Column("require_invoice_refund_approval")]
    public bool RequireInvoiceRefundApproval { get; set; }
    [Column("invoice_refund_threshold")]
    public double InvoiceRefundThreshold { get; set; }
    [Column("require_cash_out_approval")]
    public bool RequireCashOutApproval { get; set; }
    [Column("cash_out_threshold")]
    public double CashOutThreshold { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

