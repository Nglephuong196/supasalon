using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("customer_memberships")]
public class CustomerMembership
{
    [Column("id")]
    public int Id { get; set; }
    [Column("customer_id")]
    public int CustomerId { get; set; }
    [Column("type")]
    public string Type { get; set; } = string.Empty;
    [Column("status")]
    public string Status { get; set; } = string.Empty;
    [Column("start_date")]
    public DateTime StartDate { get; set; }
    [Column("end_date")]
    public DateTime? EndDate { get; set; }
    [Column("notes")]
    public string? Notes { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

