using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;




public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<Customer>().WithMany().HasForeignKey(x => x.CustomerId);
        builder.HasOne<Booking>().WithMany().HasForeignKey(x => x.BookingId);
        builder.HasOne<Branch>().WithMany().HasForeignKey(x => x.BranchId);
    }
}

