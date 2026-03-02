using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;


public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("user");
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.Email).HasColumnName("email");
        builder.Property(x => x.EmailConfirmed).HasColumnName("emailVerified");
        builder.Property(x => x.Name).HasColumnName("name");
        builder.Property(x => x.Image).HasColumnName("image");
        builder.Property(x => x.CreatedAt).HasColumnName("createdAt");
        builder.Property(x => x.UpdatedAt).HasColumnName("updatedAt");
        builder.HasIndex(x => x.Email).IsUnique();
    }
}
