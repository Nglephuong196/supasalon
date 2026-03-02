using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("session")]
public class Session
{
    [Column("id")]
    public string Id { get; set; } = string.Empty;
    [Column("expiresAt")]
    public DateTime ExpiresAt { get; set; }
    [Column("token")]
    public string Token { get; set; } = string.Empty;
    [Column("createdAt")]
    public DateTime CreatedAt { get; set; }
    [Column("updatedAt")]
    public DateTime UpdatedAt { get; set; }
    [Column("ipAddress")]
    public string? IpAddress { get; set; }
    [Column("userAgent")]
    public string? UserAgent { get; set; }
    [Column("userId")]
    public string UserId { get; set; } = string.Empty;
    [Column("activeOrganizationId")]
    public string? ActiveOrganizationId { get; set; }
}

