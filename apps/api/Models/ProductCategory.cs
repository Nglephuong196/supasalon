using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Models;

[Table("product_categories")]
public class ProductCategory
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    [Column("description")]
    public string? Description { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

