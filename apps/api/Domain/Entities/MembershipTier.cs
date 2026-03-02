namespace Api.Domain.Entities;

public class MembershipTier
{
    public int Id { get; set; }
    public string OrganizationId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public double MinSpending { get; set; }
    public double DiscountPercent { get; set; }
    public double? MinSpendingToMaintain { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }

    public Organization? Organization { get; set; }
    public ICollection<Customer> Customers { get; set; } = new List<Customer>();
}
