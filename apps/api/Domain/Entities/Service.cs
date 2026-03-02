using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("services")]
public class Service
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
    [Column("duration")]
    public int Duration { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

