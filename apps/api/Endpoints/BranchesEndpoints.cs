using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class BranchesEndpoints
{
    public static IEndpointRouteBuilder MapBranchesEndpoints(this IEndpointRouteBuilder app)
    {
        var branches = app.MapGroup("/api/branches").RequireAuthorization();

        branches.MapGet("/", ListBranches);
        branches.MapGet("/{id:int}", GetBranch);
        branches.MapPost("/", CreateBranch);
        branches.MapPut("/{id:int}", UpdateBranch);
        branches.MapDelete("/{id:int}", DeleteBranch);

        branches.MapGet("/{branchId:int}/members", ListMembers);
        branches.MapPut("/{branchId:int}/members/{memberId}", AssignMember);
        branches.MapDelete("/{branchId:int}/members/{memberId}", UnassignMember);
        branches.MapGet("/by-member/{memberId}", ByMember);

        return app;
    }

    private sealed record BranchPayload(
        string? Name,
        string? Code,
        string? Address,
        string? Phone,
        string? ManagerMemberId,
        bool? IsActive,
        bool? IsDefault);

    private sealed record BranchMemberPayload(bool? IsPrimary);

    private static async Task<IResult> ListBranches(HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var orgId = validation.OrganizationId!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        var rows = await db.Branches
            .AsNoTracking()
            .Where(x => x.OrganizationId == orgId)
            .Where(x => resolvedBranchId == null || x.Id == resolvedBranchId)
            .OrderBy(x => x.Name)
            .ToListAsync(ct);

        return Results.Ok(rows.Select(MapBranch));
    }

    private static async Task<IResult> GetBranch(int id, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        if (resolvedBranchId is int scopedBranchId && scopedBranchId != id)
        {
            return Results.Forbid();
        }

        var entity = await db.Branches
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);

        if (entity is null) return Results.NotFound(new { message = "Branch not found" });
        return Results.Ok(MapBranch(entity));
    }

    private static async Task<IResult> CreateBranch(BranchPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        if (string.IsNullOrWhiteSpace(payload.Name))
        {
            return Results.BadRequest(new { message = "Branch name is required" });
        }

        var entity = new Branch
        {
            OrganizationId = validation.OrganizationId!,
            Name = payload.Name.Trim(),
            Code = payload.Code,
            Address = payload.Address,
            Phone = payload.Phone,
            ManagerMemberId = payload.ManagerMemberId,
            IsActive = payload.IsActive ?? true,
            IsDefault = payload.IsDefault ?? false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Branches.Add(entity);
        await db.SaveChangesAsync(ct);
        return Results.Created($"/api/branches/{entity.Id}", MapBranch(entity));
    }

    private static async Task<IResult> UpdateBranch(int id, BranchPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.Branches
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);

        if (entity is null) return Results.NotFound(new { message = "Branch not found" });

        entity.Name = payload.Name ?? entity.Name;
        entity.Code = payload.Code ?? entity.Code;
        entity.Address = payload.Address ?? entity.Address;
        entity.Phone = payload.Phone ?? entity.Phone;
        entity.ManagerMemberId = payload.ManagerMemberId ?? entity.ManagerMemberId;
        entity.IsActive = payload.IsActive ?? entity.IsActive;
        entity.IsDefault = payload.IsDefault ?? entity.IsDefault;
        entity.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return Results.Ok(MapBranch(entity));
    }

    private static async Task<IResult> DeleteBranch(int id, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.Branches
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);

        if (entity is null) return Results.NotFound(new { message = "Branch not found" });

        db.Branches.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { success = true });
    }

    private static async Task<IResult> ListMembers(int branchId, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var orgId = validation.OrganizationId!;

        var rows = await (
            from link in db.MemberBranches.AsNoTracking()
            join member in db.Members.AsNoTracking() on link.MemberId equals member.Id
            join user in db.Users.AsNoTracking() on member.UserId equals user.Id into users
            from user in users.DefaultIfEmpty()
            where link.OrganizationId == orgId && link.BranchId == branchId
            select new
            {
                link,
                member,
                user
            }
        ).ToListAsync(ct);

        return Results.Ok(rows.Select(x => new
        {
            id = x.link.Id,
            organizationId = x.link.OrganizationId,
            branchId = x.link.BranchId,
            memberId = x.link.MemberId,
            isPrimary = x.link.IsPrimary,
            createdAt = x.link.CreatedAt,
            member = new
            {
                id = x.member.Id,
                role = x.member.Role,
                user = x.user is null
                    ? null
                    : new
                    {
                        id = x.user.Id,
                        name = x.user.Name,
                        email = x.user.Email,
                        image = x.user.Image
                    }
            }
        }));
    }

    private static async Task<IResult> AssignMember(
        int branchId,
        string memberId,
        BranchMemberPayload payload,
        HttpContext httpContext,
        AppDbContext db,
        CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var orgId = validation.OrganizationId!;

        var branch = await db.Branches.AsNoTracking().FirstOrDefaultAsync(x => x.OrganizationId == orgId && x.Id == branchId, ct);
        if (branch is null) return Results.NotFound(new { message = "Branch not found" });

        var member = await db.Members.AsNoTracking().FirstOrDefaultAsync(x => x.OrganizationId == orgId && x.Id == memberId, ct);
        if (member is null) return Results.NotFound(new { message = "Member not found" });

        var isPrimary = payload.IsPrimary ?? false;
        if (isPrimary)
        {
            var existingPrimary = await db.MemberBranches
                .Where(x => x.OrganizationId == orgId && x.MemberId == memberId && x.IsPrimary)
                .ToListAsync(ct);
            foreach (var item in existingPrimary)
            {
                item.IsPrimary = false;
            }
        }

        var assignment = await db.MemberBranches
            .FirstOrDefaultAsync(x => x.OrganizationId == orgId && x.BranchId == branchId && x.MemberId == memberId, ct);

        if (assignment is null)
        {
            assignment = new MemberBranch
            {
                OrganizationId = orgId,
                BranchId = branchId,
                MemberId = memberId,
                IsPrimary = isPrimary,
                CreatedAt = DateTime.UtcNow
            };
            db.MemberBranches.Add(assignment);
        }
        else
        {
            assignment.IsPrimary = isPrimary;
        }

        await db.SaveChangesAsync(ct);

        return Results.Ok(new
        {
            id = assignment.Id,
            organizationId = assignment.OrganizationId,
            branchId = assignment.BranchId,
            memberId = assignment.MemberId,
            isPrimary = assignment.IsPrimary,
            createdAt = assignment.CreatedAt
        });
    }

    private static async Task<IResult> UnassignMember(int branchId, string memberId, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var orgId = validation.OrganizationId!;

        var assignment = await db.MemberBranches
            .FirstOrDefaultAsync(x => x.OrganizationId == orgId && x.BranchId == branchId && x.MemberId == memberId, ct);

        if (assignment is null) return Results.NotFound(new { message = "Assignment not found" });

        db.MemberBranches.Remove(assignment);
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { success = true });
    }

    private static async Task<IResult> ByMember(string memberId, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;
        var orgId = validation.OrganizationId!;

        var rows = await (
            from link in db.MemberBranches.AsNoTracking()
            join branch in db.Branches.AsNoTracking() on link.BranchId equals branch.Id
            where link.OrganizationId == orgId && link.MemberId == memberId
            select new
            {
                id = link.Id,
                organizationId = link.OrganizationId,
                branchId = link.BranchId,
                memberId = link.MemberId,
                isPrimary = link.IsPrimary,
                createdAt = link.CreatedAt,
                branch = MapBranch(branch)
            }
        ).ToListAsync(ct);

        return Results.Ok(rows);
    }

    private static object MapBranch(Branch branch) => new
    {
        id = branch.Id,
        organizationId = branch.OrganizationId,
        name = branch.Name,
        code = branch.Code,
        address = branch.Address,
        phone = branch.Phone,
        managerMemberId = branch.ManagerMemberId,
        isActive = branch.IsActive,
        isDefault = branch.IsDefault,
        createdAt = branch.CreatedAt,
        updatedAt = branch.UpdatedAt,
        manager = (object?)null
    };
}
