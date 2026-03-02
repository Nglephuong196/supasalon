namespace Api.Domain.Entities;

public class Organization
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Logo { get; set; }
    public string? Metadata { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<Branch> Branches { get; set; } = new List<Branch>();
    public ICollection<MembershipTier> MembershipTiers { get; set; } = new List<MembershipTier>();
    public ICollection<Customer> Customers { get; set; } = new List<Customer>();
}
