using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("member_branches")]
public class MemberBranch
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("branch_id")]
    public int BranchId { get; set; }
    [Column("member_id")]
    public string MemberId { get; set; } = string.Empty;
    [Column("is_primary")]
    public bool IsPrimary { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

