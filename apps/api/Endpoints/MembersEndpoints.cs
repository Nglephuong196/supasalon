using Api.Data;
using Api.Models;
using Api.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Api.Endpoints;

public static class MembersEndpoints
{
    public static IEndpointRouteBuilder MapMembersEndpoints(this IEndpointRouteBuilder app)
    {
        var members = app.MapGroup("/api/members").RequireAuthorization();

        members.MapGet("/", ListMembers);
        members.MapPost("/", CreateMember);
        members.MapPut("/update-member-role", UpdateRole);
        members.MapDelete("/remove-member", RemoveMember);
        members.MapPut("/{memberId}/permissions", UpdatePermissions);

        return app;
    }

    private static async Task<IResult> ListMembers(
        HttpContext httpContext,
        int? page,
        int? limit,
        string? search,
        int? paginated,
        AppDbContext db,
        CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var organizationId = validation.OrganizationId!;
        var query =
            from member in db.Members.AsNoTracking()
            join user in db.Users.AsNoTracking() on member.UserId equals user.Id into users
            from user in users.DefaultIfEmpty()
            where member.OrganizationId == organizationId
            select new { member, user };

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim()}%";
            query = query.Where(x =>
                (x.user != null && (
                    (x.user.Name != null && EF.Functions.ILike(x.user.Name, pattern)) ||
                    (x.user.Email != null && EF.Functions.ILike(x.user.Email, pattern)))) ||
                EF.Functions.ILike(x.member.Role, pattern));
        }

        var rows = await query.OrderByDescending(x => x.member.CreatedAt).ToListAsync(ct);
        var memberIds = rows.Select(x => x.member.Id).ToList();

        var permissionsByMember = await db.MemberPermissions
            .AsNoTracking()
            .Where(x => memberIds.Contains(x.MemberId))
            .GroupBy(x => x.MemberId)
            .ToDictionaryAsync(
                g => g.Key,
                g => g.Select(item => new
                {
                    permissions = item.Permissions is null
                        ? new Dictionary<string, string[]>()
                        : JsonSerializer.Deserialize<Dictionary<string, string[]>>(item.Permissions.RootElement.GetRawText())
                            ?? new Dictionary<string, string[]>()
                }).ToList(),
                ct);

        var mapped = rows.Select(x => new
        {
            id = x.member.Id,
            role = x.member.Role,
            permissions = permissionsByMember.TryGetValue(x.member.Id, out var perms)
                ? (object)perms
                : Array.Empty<object>(),
            user = x.user is null
                ? null
                : new
                {
                    id = x.user.Id,
                    name = x.user.Name,
                    email = x.user.Email,
                    image = x.user.Image
                }
        }).ToList();

        if (paginated == 1)
        {
            var safePage = PaginationDefaults.Page(page);
            var safeLimit = PaginationDefaults.Limit(limit);
            var total = mapped.Count;
            var data = mapped
                .Skip((safePage - 1) * safeLimit)
                .Take(safeLimit)
                .ToList();
            var totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)safeLimit));

            return Results.Ok(new
            {
                data,
                total,
                page = safePage,
                limit = safeLimit,
                totalPages
            });
        }

        return Results.Ok(mapped);
    }

    private sealed record CreateMemberRequest(string Name, string Email, string Password, string Role);

    private static async Task<IResult> CreateMember(
        CreateMemberRequest request,
        HttpContext httpContext,
        AppDbContext db,
        UserManager<User> userManager,
        CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var organizationId = validation.OrganizationId!;
        var existing = await userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
        {
            return Results.Conflict(new { message = "Email is already registered." });
        }

        var user = new User
        {
            UserName = request.Email,
            Email = request.Email,
            Name = request.Name,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            return Results.BadRequest(new { errors = createResult.Errors.Select(x => x.Description) });
        }

        var member = new Member
        {
            Id = Guid.NewGuid().ToString("N"),
            OrganizationId = organizationId,
            UserId = user.Id,
            Role = string.IsNullOrWhiteSpace(request.Role) ? "staff" : request.Role,
            CreatedAt = DateTime.UtcNow
        };

        db.Members.Add(member);
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/members/{member.Id}", new
        {
            id = member.Id,
            role = member.Role,
            user = new
            {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                image = user.Image
            }
        });
    }

    private sealed record UpdateRoleRequest(string MemberId, string Role);

    private static async Task<IResult> UpdateRole(
        UpdateRoleRequest request,
        HttpContext httpContext,
        AppDbContext db,
        CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var member = await db.Members
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == request.MemberId, ct);

        if (member is null)
        {
            return Results.NotFound(new { message = "Member not found" });
        }

        member.Role = request.Role;
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { success = true });
    }

    private static async Task<IResult> RemoveMember(
        string memberIdOrEmail,
        HttpContext httpContext,
        AppDbContext db,
        CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var organizationId = validation.OrganizationId!;
        var value = memberIdOrEmail?.Trim();
        if (string.IsNullOrWhiteSpace(value))
        {
            return Results.BadRequest(new { message = "memberIdOrEmail is required" });
        }

        var member = await (
            from m in db.Members
            join u in db.Users on m.UserId equals u.Id
            where m.OrganizationId == organizationId && (m.Id == value || u.Email == value)
            select m
        ).FirstOrDefaultAsync(ct);

        if (member is null)
        {
            return Results.NotFound(new { message = "Member not found" });
        }

        db.Members.Remove(member);
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { success = true });
    }

    private sealed record UpdatePermissionsRequest(Dictionary<string, string[]> Permissions);

    private static async Task<IResult> UpdatePermissions(
        string memberId,
        UpdatePermissionsRequest request,
        HttpContext httpContext,
        AppDbContext db,
        CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var member = await db.Members
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == memberId, ct);

        if (member is null)
        {
            return Results.NotFound(new { message = "Member not found" });
        }

        var existing = await db.MemberPermissions
            .Where(x => x.MemberId == memberId)
            .ToListAsync(ct);

        db.MemberPermissions.RemoveRange(existing);
        db.MemberPermissions.Add(new MemberPermission
        {
            MemberId = memberId,
            Permissions = JsonDocument.Parse(JsonSerializer.Serialize(request.Permissions ?? new Dictionary<string, string[]>())),
            CreatedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync(ct);

        return Results.Ok(new { success = true });
    }
}
