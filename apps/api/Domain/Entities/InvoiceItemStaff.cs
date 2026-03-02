using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("invoice_item_staff")]
public class InvoiceItemStaff
{
    [Column("id")]
    public int Id { get; set; }
    [Column("invoice_item_id")]
    public int InvoiceItemId { get; set; }
    [Column("staff_id")]
    public string StaffId { get; set; } = string.Empty;
    [Column("role")]
    public string Role { get; set; } = string.Empty;
    [Column("commission_value")]
    public double? CommissionValue { get; set; }
    [Column("commission_type")]
    public string? CommissionType { get; set; }
    [Column("bonus")]
    public double? Bonus { get; set; }
}

