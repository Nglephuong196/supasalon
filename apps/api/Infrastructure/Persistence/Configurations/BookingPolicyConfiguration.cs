using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;



public class BookingPolicyConfiguration : IEntityTypeConfiguration<BookingPolicy>
{
    public void Configure(EntityTypeBuilder<BookingPolicy> builder)
    {
        builder.HasIndex(x => x.OrganizationId).IsUnique().HasDatabaseName("booking_policies_org_unique");
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
    }
}

