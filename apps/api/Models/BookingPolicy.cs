using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Api.Models;

[Table("booking_policies")]
public class BookingPolicy
{
    [Column("id")]
    public int Id { get; set; }
    [Column("organization_id")]
    public string OrganizationId { get; set; } = string.Empty;
    [Column("prevent_staff_overlap")]
    public bool PreventStaffOverlap { get; set; }
    [Column("buffer_minutes")]
    public int BufferMinutes { get; set; }
    [Column("require_deposit")]
    public bool RequireDeposit { get; set; }
    [Column("default_deposit_amount")]
    public double DefaultDepositAmount { get; set; }
    [Column("cancellation_window_hours")]
    public int CancellationWindowHours { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

