using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;





public class ApprovalRequestConfiguration : IEntityTypeConfiguration<ApprovalRequest>
{
    public void Configure(EntityTypeBuilder<ApprovalRequest> builder)
    {
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.RequestedByUserId);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.ReviewedByUserId);
    }
}

