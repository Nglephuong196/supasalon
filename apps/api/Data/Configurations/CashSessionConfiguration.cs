using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;


public class CashSessionConfiguration : IEntityTypeConfiguration<CashSession>
{
    public void Configure(EntityTypeBuilder<CashSession> builder)
    {
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.OpenedByUserId);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.ClosedByUserId);
    }
}

