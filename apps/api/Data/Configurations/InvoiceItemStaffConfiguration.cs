using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;






public class InvoiceItemStaffConfiguration : IEntityTypeConfiguration<InvoiceItemStaff>
{
    public void Configure(EntityTypeBuilder<InvoiceItemStaff> builder)
    {
        builder.HasOne<InvoiceItem>().WithMany().HasForeignKey(x => x.InvoiceItemId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Member>().WithMany().HasForeignKey(x => x.StaffId);
    }
}

