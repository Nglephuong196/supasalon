using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;


public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<Customer>().WithMany().HasForeignKey(x => x.CustomerId);
        builder.HasOne<Branch>().WithMany().HasForeignKey(x => x.BranchId);
    }
}

