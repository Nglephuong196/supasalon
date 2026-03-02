using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;








public class PayrollItemConfiguration : IEntityTypeConfiguration<PayrollItem>
{
    public void Configure(EntityTypeBuilder<PayrollItem> builder)
    {
        builder.HasIndex(x => new { x.CycleId, x.StaffId }).IsUnique().HasDatabaseName("payroll_items_cycle_staff_unique");

        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<PayrollCycle>().WithMany().HasForeignKey(x => x.CycleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Member>().WithMany().HasForeignKey(x => x.StaffId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Branch>().WithMany().HasForeignKey(x => x.BranchId);
    }
}

