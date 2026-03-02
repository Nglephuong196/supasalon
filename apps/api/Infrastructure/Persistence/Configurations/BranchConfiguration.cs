using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;



public class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.ToTable("branches");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.OrganizationId).HasColumnName("organization_id");
        builder.Property(x => x.Name).HasColumnName("name");
        builder.Property(x => x.Code).HasColumnName("code");
        builder.Property(x => x.Address).HasColumnName("address");
        builder.Property(x => x.Phone).HasColumnName("phone");
        builder.Property(x => x.ManagerMemberId).HasColumnName("manager_member_id");
        builder.Property(x => x.IsActive).HasColumnName("is_active");
        builder.Property(x => x.IsDefault).HasColumnName("is_default");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(x => new { x.OrganizationId, x.Name }).IsUnique().HasDatabaseName("branches_org_name_unique");
        builder.HasIndex(x => new { x.OrganizationId, x.Code }).IsUnique().HasDatabaseName("branches_org_code_unique");
        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<Member>().WithMany().HasForeignKey(x => x.ManagerMemberId);
    }
}

