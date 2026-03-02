using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;






public class CustomerPrepaidTransactionConfiguration : IEntityTypeConfiguration<CustomerPrepaidTransaction>
{
    public void Configure(EntityTypeBuilder<CustomerPrepaidTransaction> builder)
    {
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<CustomerPrepaidCard>().WithMany().HasForeignKey(x => x.CardId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Customer>().WithMany().HasForeignKey(x => x.CustomerId);
        builder.HasOne<Invoice>().WithMany().HasForeignKey(x => x.InvoiceId);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.CreatedByUserId);
    }
}

