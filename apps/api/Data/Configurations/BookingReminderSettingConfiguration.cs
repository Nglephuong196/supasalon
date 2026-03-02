using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;


public class BookingReminderSettingConfiguration : IEntityTypeConfiguration<BookingReminderSetting>
{
    public void Configure(EntityTypeBuilder<BookingReminderSetting> builder)
    {
        builder.HasIndex(x => x.OrganizationId).IsUnique().HasDatabaseName("booking_reminder_settings_org_unique");
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<User>().WithMany().HasForeignKey(x => x.UpdatedByUserId);
    }
}

