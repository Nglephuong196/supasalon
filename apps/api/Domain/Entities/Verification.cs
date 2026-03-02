using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("verification")]
public class Verification
{
    [Column("id")]
    public string Id { get; set; } = string.Empty;
    [Column("identifier")]
    public string Identifier { get; set; } = string.Empty;
    [Column("value")]
    public string Value { get; set; } = string.Empty;
    [Column("expiresAt")]
    public DateTime ExpiresAt { get; set; }
    [Column("createdAt")]
    public DateTime? CreatedAt { get; set; }
    [Column("updatedAt")]
    public DateTime? UpdatedAt { get; set; }
}

