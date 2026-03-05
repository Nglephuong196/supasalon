using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Api.Endpoints;

public static class OrganizationsEndpoints
{
    public static IEndpointRouteBuilder MapOrganizationsEndpoints(this IEndpointRouteBuilder app)
    {
        var organizations = app.MapGroup("/api/organizations").RequireAuthorization();

        organizations.MapGet("/", ListOrganizations);
        organizations.MapPost("/", CreateOrganization);
        organizations.MapPost("/active", SetActiveOrganization);

        return app;
    }

    private sealed record CreateOrganizationPayload(string Name, string? Slug);

    private static async Task<IResult> ListOrganizations(HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var userId = ResolveUserId(httpContext);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Results.Unauthorized();
        }

        var rows = await (
            from member in db.Members.AsNoTracking()
            join organization in db.Organizations.AsNoTracking() on member.OrganizationId equals organization.Id
            where member.UserId == userId
            orderby organization.Name
            select new
            {
                id = organization.Id,
                name = organization.Name,
                slug = organization.Slug,
                role = member.Role
            }
        ).ToListAsync(ct);

        return Results.Ok(rows.Take(1));
    }

    private static async Task<IResult> CreateOrganization(CreateOrganizationPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var userId = ResolveUserId(httpContext);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Results.Unauthorized();
        }

        var hasExistingMembership = await db.Members.AsNoTracking().AnyAsync(x => x.UserId == userId, ct);
        if (hasExistingMembership)
        {
            return Results.Conflict(new { message = "One user can only have one organization." });
        }

        if (string.IsNullOrWhiteSpace(payload.Name))
        {
            return Results.BadRequest(new { message = "Organization name is required." });
        }

        var slug = string.IsNullOrWhiteSpace(payload.Slug) ? null : payload.Slug.Trim().ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(slug))
        {
            var exists = await db.Organizations.AsNoTracking().AnyAsync(x => x.Slug == slug, ct);
            if (exists)
            {
                return Results.Conflict(new { message = "Slug is already taken." });
            }
        }

        var now = DateTime.UtcNow;
        var organization = new Organization
        {
            Id = Guid.NewGuid().ToString("N"),
            Name = payload.Name.Trim(),
            Slug = slug,
            CreatedAt = now
        };
        db.Organizations.Add(organization);

        var ownerMembership = new Member
        {
            Id = Guid.NewGuid().ToString("N"),
            OrganizationId = organization.Id,
            UserId = userId,
            Role = "owner",
            CreatedAt = now
        };
        db.Members.Add(ownerMembership);

        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/organizations/{organization.Id}", new
        {
            id = organization.Id,
            name = organization.Name,
            slug = organization.Slug,
            role = ownerMembership.Role
        });
    }

    private static async Task<IResult> SetActiveOrganization(HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var userId = ResolveUserId(httpContext);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Results.Unauthorized();
        }

        var memberships = await (
            from member in db.Members.AsNoTracking()
            join organization in db.Organizations.AsNoTracking() on member.OrganizationId equals organization.Id
            where member.UserId == userId
            select new
            {
                id = organization.Id,
                name = organization.Name,
                slug = organization.Slug,
                role = member.Role
            }
        ).ToListAsync(ct);

        if (memberships.Count == 0)
        {
            return Results.Forbid();
        }

        if (memberships.Select(x => x.id).Distinct().Skip(1).Any())
        {
            return Results.Conflict(new { message = "One user can only have one organization." });
        }

        return Results.Ok(memberships[0]);
    }

    private static string? ResolveUserId(HttpContext httpContext)
    {
        return httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? httpContext.User.FindFirstValue(ClaimTypes.Name)
            ?? httpContext.User.FindFirstValue("sub");
    }
}
