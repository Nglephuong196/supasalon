using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;




public class PrepaidPlanConfiguration : IEntityTypeConfiguration<PrepaidPlan>
{
    public void Configure(EntityTypeBuilder<PrepaidPlan> builder)
    {
        builder.HasIndex(x => new { x.OrganizationId, x.Name }).IsUnique().HasDatabaseName("prepaid_plans_org_name_unique");
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
    }
}

