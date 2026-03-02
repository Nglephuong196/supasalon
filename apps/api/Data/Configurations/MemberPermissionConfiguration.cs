using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;













public class MemberPermissionConfiguration : IEntityTypeConfiguration<MemberPermission>
{
    public void Configure(EntityTypeBuilder<MemberPermission> builder)
    {
        builder.HasOne<Member>().WithMany().HasForeignKey(x => x.MemberId).OnDelete(DeleteBehavior.Cascade);
    }
}

