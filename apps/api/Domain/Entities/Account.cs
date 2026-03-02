using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("account")]
public class Account
{
    [Column("id")]
    public string Id { get; set; } = string.Empty;
    [Column("accountId")]
    public string AccountId { get; set; } = string.Empty;
    [Column("providerId")]
    public string ProviderId { get; set; } = string.Empty;
    [Column("userId")]
    public string UserId { get; set; } = string.Empty;
    [Column("accessToken")]
    public string? AccessToken { get; set; }
    [Column("refreshToken")]
    public string? RefreshToken { get; set; }
    [Column("idToken")]
    public string? IdToken { get; set; }
    [Column("accessTokenExpiresAt")]
    public DateTime? AccessTokenExpiresAt { get; set; }
    [Column("refreshTokenExpiresAt")]
    public DateTime? RefreshTokenExpiresAt { get; set; }
    [Column("scope")]
    public string? Scope { get; set; }
    [Column("password")]
    public string? Password { get; set; }
    [Column("createdAt")]
    public DateTime CreatedAt { get; set; }
    [Column("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}

