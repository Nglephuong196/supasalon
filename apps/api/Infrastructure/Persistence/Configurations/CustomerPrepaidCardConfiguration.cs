using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;





public class CustomerPrepaidCardConfiguration : IEntityTypeConfiguration<CustomerPrepaidCard>
{
    public void Configure(EntityTypeBuilder<CustomerPrepaidCard> builder)
    {
        builder.HasIndex(x => new { x.OrganizationId, x.CardCode }).IsUnique().HasDatabaseName("customer_prepaid_cards_org_code_unique");
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<Customer>().WithMany().HasForeignKey(x => x.CustomerId);
        builder.HasOne<PrepaidPlan>().WithMany().HasForeignKey(x => x.PlanId);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.CreatedByUserId);
    }
}

