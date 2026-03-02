using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;







public class InvoicePaymentTransactionConfiguration : IEntityTypeConfiguration<InvoicePaymentTransaction>
{
    public void Configure(EntityTypeBuilder<InvoicePaymentTransaction> builder)
    {
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<Invoice>().WithMany().HasForeignKey(x => x.InvoiceId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<CashSession>().WithMany().HasForeignKey(x => x.CashSessionId);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.CreatedByUserId);
    }
}

