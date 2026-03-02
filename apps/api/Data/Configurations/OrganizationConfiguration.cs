using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;


public class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.ToTable("organization");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.Name).HasColumnName("name");
        builder.Property(x => x.Slug).HasColumnName("slug");
        builder.Property(x => x.Logo).HasColumnName("logo");
        builder.Property(x => x.Metadata).HasColumnName("metadata");
        builder.Property(x => x.CreatedAt).HasColumnName("createdAt");

        builder.HasIndex(x => x.Slug).IsUnique();

        builder.HasMany(x => x.Branches)
            .WithOne(x => x.Organization)
            .HasForeignKey(x => x.OrganizationId);

        builder.HasMany(x => x.MembershipTiers)
            .WithOne(x => x.Organization)
            .HasForeignKey(x => x.OrganizationId);

        builder.HasMany(x => x.Customers)
            .WithOne(x => x.Organization)
            .HasForeignKey(x => x.OrganizationId);
    }
}

