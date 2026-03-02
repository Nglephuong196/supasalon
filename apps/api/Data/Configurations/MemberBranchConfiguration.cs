using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;






public class MemberBranchConfiguration : IEntityTypeConfiguration<MemberBranch>
{
    public void Configure(EntityTypeBuilder<MemberBranch> builder)
    {
        builder.HasIndex(x => new { x.OrganizationId, x.BranchId, x.MemberId })
            .IsUnique()
            .HasDatabaseName("member_branches_org_branch_member_unique");

        builder.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId);
        builder.HasOne<Branch>().WithMany().HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Member>().WithMany().HasForeignKey(x => x.MemberId).OnDelete(DeleteBehavior.Cascade);
    }
}

