using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;










public class StaffCommissionPayoutConfiguration : IEntityTypeConfiguration<StaffCommissionPayout>
{
    public void Configure(EntityTypeBuilder<StaffCommissionPayout> builder)
    {
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<Member>().WithMany().HasForeignKey(x => x.StaffId).OnDelete(DeleteBehavior.Cascade);
    }
}

