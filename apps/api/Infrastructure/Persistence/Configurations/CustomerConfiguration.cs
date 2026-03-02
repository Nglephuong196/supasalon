using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;





public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("customers");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.OrganizationId).HasColumnName("organization_id");
        builder.Property(x => x.Name).HasColumnName("name");
        builder.Property(x => x.Email).HasColumnName("email");
        builder.Property(x => x.Phone).HasColumnName("phone");
        builder.Property(x => x.Gender).HasColumnName("gender");
        builder.Property(x => x.Location).HasColumnName("location");
        builder.Property(x => x.Birthday).HasColumnName("birthday");
        builder.Property(x => x.Notes).HasColumnName("notes");
        builder.Property(x => x.TotalSpent).HasColumnName("total_spent");
        builder.Property(x => x.MembershipTierId).HasColumnName("membership_tier_id");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");

        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<MembershipTier>().WithMany().HasForeignKey(x => x.MembershipTierId);
    }
}

