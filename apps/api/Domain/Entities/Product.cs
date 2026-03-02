using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("products")]
public class Product
{
    [Column("id")]
    public int Id { get; set; }
    [Column("category_id")]
    public int CategoryId { get; set; }
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    [Column("description")]
    public string? Description { get; set; }
    [Column("price")]
    public double Price { get; set; }
    [Column("stock")]
    public int Stock { get; set; }
    [Column("min_stock")]
    public int MinStock { get; set; }
    [Column("sku")]
    public string? Sku { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

