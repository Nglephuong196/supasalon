using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;




public class ApprovalPolicyConfiguration : IEntityTypeConfiguration<ApprovalPolicy>
{
    public void Configure(EntityTypeBuilder<ApprovalPolicy> builder)
    {
        builder.HasIndex(x => x.OrganizationId).IsUnique().HasDatabaseName("approval_policies_org_unique");
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
    }
}

