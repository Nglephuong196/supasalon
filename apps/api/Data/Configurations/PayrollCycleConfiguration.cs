using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;







public class PayrollCycleConfiguration : IEntityTypeConfiguration<PayrollCycle>
{
    public void Configure(EntityTypeBuilder<PayrollCycle> builder)
    {
        builder.HasIndex(x => new { x.OrganizationId, x.BranchId, x.FromDate, x.ToDate })
            .IsUnique()
            .HasDatabaseName("payroll_cycles_org_branch_period_unique");

        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<Branch>().WithMany().HasForeignKey(x => x.BranchId);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.CreatedByUserId);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.FinalizedByUserId);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.PaidByUserId);
    }
}

