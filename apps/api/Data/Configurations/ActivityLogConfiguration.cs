using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;











public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
{
    public void Configure(EntityTypeBuilder<ActivityLog> builder)
    {
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.ActorUserId);
    }
}

