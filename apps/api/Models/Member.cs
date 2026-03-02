using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Models;

[Table("member")]
public class Member
{
    [Column("id")]
    public string Id { get; set; } = string.Empty;
    [Column("organizationId")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("userId")]
    public string UserId { get; set; } = string.Empty;
    [Column("role")]
    public string Role { get; set; } = string.Empty;
    [Column("createdAt")]
    public DateTime CreatedAt { get; set; }
}

