using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Models;

[Table("invitation")]
public class Invitation
{
    [Column("id")]
    public string Id { get; set; } = string.Empty;
    [Column("organizationId")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("email")]
    public string Email { get; set; } = string.Empty;
    [Column("role")]
    public string? Role { get; set; }
    [Column("status")]
    public string Status { get; set; } = string.Empty;
    [Column("expiresAt")]
    public DateTime ExpiresAt { get; set; }
    [Column("inviterId")]
    public string InviterId { get; set; } = string.Empty;
}

