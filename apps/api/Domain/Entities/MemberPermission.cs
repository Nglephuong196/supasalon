using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("member_permissions")]
public class MemberPermission
{
    [Column("id")]
    public int Id { get; set; }
    [Column("member_id")]
    public string MemberId { get; set; } = string.Empty;
    [Column("permissions", TypeName = "jsonb")]
    public JsonDocument? Permissions { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
