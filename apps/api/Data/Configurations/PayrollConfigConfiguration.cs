using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;






public class PayrollConfigConfiguration : IEntityTypeConfiguration<PayrollConfig>
{
    public void Configure(EntityTypeBuilder<PayrollConfig> builder)
    {
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<Branch>().WithMany().HasForeignKey(x => x.BranchId);
        builder.HasOne<Member>().WithMany().HasForeignKey(x => x.StaffId).OnDelete(DeleteBehavior.Cascade);
    }
}

