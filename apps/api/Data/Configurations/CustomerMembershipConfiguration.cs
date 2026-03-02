using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;












public class CustomerMembershipConfiguration : IEntityTypeConfiguration<CustomerMembership>
{
    public void Configure(EntityTypeBuilder<CustomerMembership> builder)
    {
        builder.HasOne<Customer>().WithMany().HasForeignKey(x => x.CustomerId);
    }
}

