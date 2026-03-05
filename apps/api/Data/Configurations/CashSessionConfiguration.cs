using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;


public class CashSessionConfiguration : IEntityTypeConfiguration<CashSession>
{
    public void Configure(EntityTypeBuilder<CashSession> builder)
    {
        builder.HasIndex(x => new { x.OrganizationId, x.BranchId, x.Status });
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<Branch>().WithMany().HasForeignKey(x => x.BranchId);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.OpenedByUserId);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.ClosedByUserId);
    }
}
