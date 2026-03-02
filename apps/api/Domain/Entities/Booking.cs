using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Domain.Entities;

[Table("bookings")]
public class Booking
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("customer_id")]
    public int CustomerId { get; set; }
    [Column("branch_id")]
    public int? BranchId { get; set; }
    [Column("date")]
    public DateTime Date { get; set; }
    [Column("status")]
    public string Status { get; set; } = string.Empty;
    [Column("deposit_amount")]
    public double DepositAmount { get; set; }
    [Column("deposit_paid")]
    public double DepositPaid { get; set; }
    [Column("no_show_reason")]
    public string? NoShowReason { get; set; }
    [Column("no_show_at")]
    public DateTime? NoShowAt { get; set; }
    [Column("guest_count")]
    public int GuestCount { get; set; }
    [Column("notes")]
    public string? Notes { get; set; }
    [Column("guests", TypeName = "jsonb")]
    public JsonDocument? Guests { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}

