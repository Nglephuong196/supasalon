using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;












public class CustomerMembershipConfiguration : IEntityTypeConfiguration<CustomerMembership>
{
    public void Configure(EntityTypeBuilder<CustomerMembership> builder)
    {
        builder.HasOne<Customer>().WithMany().HasForeignKey(x => x.CustomerId);
    }
}

