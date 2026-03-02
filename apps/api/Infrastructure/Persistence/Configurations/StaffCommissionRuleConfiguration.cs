using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;









public class StaffCommissionRuleConfiguration : IEntityTypeConfiguration<StaffCommissionRule>
{
    public void Configure(EntityTypeBuilder<StaffCommissionRule> builder)
    {
        builder.HasIndex(x => new { x.OrganizationId, x.StaffId, x.ItemType, x.ItemId })
            .IsUnique()
            .HasDatabaseName("staff_commission_rules_staff_item_unique");

        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<Member>().WithMany().HasForeignKey(x => x.StaffId).OnDelete(DeleteBehavior.Cascade);
    }
}

