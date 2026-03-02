using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;

namespace Api.Domain.Entities;

[Table("user")]
public class User : IdentityUser
{
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    [Column("image")]
    public string? Image { get; set; }
    [Column("createdAt")]
    public DateTime CreatedAt { get; set; }
    [Column("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}
