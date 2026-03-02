using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Models;

[Table("invoice_items")]
public class InvoiceItem
{
    [Column("id")]
    public int Id { get; set; }
    [Column("invoice_id")]
    public int InvoiceId { get; set; }
    [Column("type")]
    public string Type { get; set; } = string.Empty;
    [Column("reference_id")]
    public int? ReferenceId { get; set; }
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    [Column("quantity")]
    public int Quantity { get; set; }
    [Column("unit_price")]
    public double UnitPrice { get; set; }
    [Column("discount_value")]
    public double? DiscountValue { get; set; }
    [Column("discount_type")]
    public string? DiscountType { get; set; }
    [Column("total")]
    public double Total { get; set; }
}

