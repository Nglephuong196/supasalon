using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;



public class CashTransactionConfiguration : IEntityTypeConfiguration<CashTransaction>
{
    public void Configure(EntityTypeBuilder<CashTransaction> builder)
    {
        builder.HasIndex(x => new { x.OrganizationId, x.BranchId, x.CreatedAt });
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<Branch>().WithMany().HasForeignKey(x => x.BranchId);
        builder.HasOne<CashSession>().WithMany().HasForeignKey(x => x.CashSessionId);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.CreatedByUserId);
    }
}
