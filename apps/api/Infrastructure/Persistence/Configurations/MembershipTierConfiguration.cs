using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;




public class MembershipTierConfiguration : IEntityTypeConfiguration<MembershipTier>
{
    public void Configure(EntityTypeBuilder<MembershipTier> builder)
    {
        builder.ToTable("membership_tiers");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.OrganizationId).HasColumnName("organization_id");
        builder.Property(x => x.Name).HasColumnName("name");
        builder.Property(x => x.MinSpending).HasColumnName("min_spending");
        builder.Property(x => x.DiscountPercent).HasColumnName("discount_percent");
        builder.Property(x => x.MinSpendingToMaintain).HasColumnName("min_spending_to_maintain");
        builder.Property(x => x.SortOrder).HasColumnName("sort_order");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");

        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasMany(x => x.Customers)
            .WithOne(x => x.MembershipTier)
            .HasForeignKey(x => x.MembershipTierId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

