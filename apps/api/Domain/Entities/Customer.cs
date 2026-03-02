namespace Api.Domain.Entities;

public class Customer
{
    public int Id { get; set; }
    public string OrganizationId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public string? Location { get; set; }
    public DateTime? Birthday { get; set; }
    public string? Notes { get; set; }
    public double TotalSpent { get; set; }
    public int? MembershipTierId { get; set; }
    public DateTime CreatedAt { get; set; }

    public Organization? Organization { get; set; }
    public MembershipTier? MembershipTier { get; set; }
}
