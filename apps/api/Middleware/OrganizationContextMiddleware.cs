using Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Api.Middleware;

public sealed class OrganizationContextMiddleware(RequestDelegate next)
{
    public const string OrganizationItemKey = "ResolvedOrganizationId";
    public const string BranchItemKey = "ResolvedBranchId";
    public const string BranchHeaderName = "X-Branch-Id";

    public async Task InvokeAsync(HttpContext httpContext, AppDbContext db)
    {
        if (!RequiresOrganization(httpContext.Request.Path))
        {
            await next(httpContext);
            return;
        }

        var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? httpContext.User.FindFirstValue(ClaimTypes.Name)
            ?? httpContext.User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await httpContext.Response.WriteAsJsonAsync(new { message = "Unauthorized" });
            return;
        }

        var memberships = await db.Members
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => x.OrganizationId)
            .ToListAsync(httpContext.RequestAborted);
        if (memberships.Count == 0)
        {
            httpContext.Response.StatusCode = StatusCodes.Status403Forbidden;
            await httpContext.Response.WriteAsJsonAsync(new { message = "You are not assigned to any organization." });
            return;
        }

        var orgIds = memberships.Distinct().ToList();
        if (orgIds.Count > 1)
        {
            httpContext.Response.StatusCode = StatusCodes.Status409Conflict;
            await httpContext.Response.WriteAsJsonAsync(new
            {
                message = "Invalid account state: one user can only belong to one organization."
            });
            return;
        }

        var resolvedOrganizationId = orgIds[0];

        var member = await db.Members
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationId == resolvedOrganizationId && x.UserId == userId, httpContext.RequestAborted);

        if (member is null)
        {
            httpContext.Response.StatusCode = StatusCodes.Status403Forbidden;
            await httpContext.Response.WriteAsJsonAsync(new { message = "You do not have access to this organization." });
            return;
        }

        var branchAssignments = await db.MemberBranches
            .AsNoTracking()
            .Where(x => x.OrganizationId == resolvedOrganizationId && x.MemberId == member.Id)
            .OrderByDescending(x => x.IsPrimary)
            .ThenBy(x => x.Id)
            .Select(x => x.BranchId)
            .Distinct()
            .ToListAsync(httpContext.RequestAborted);

        var branchHeaderValue = httpContext.Request.Headers[BranchHeaderName].FirstOrDefault()?.Trim();
        var hasRequestedBranch = int.TryParse(branchHeaderValue, out var requestedBranchId);

        if (branchAssignments.Count > 0)
        {
            if (hasRequestedBranch && !branchAssignments.Contains(requestedBranchId))
            {
                httpContext.Response.StatusCode = StatusCodes.Status403Forbidden;
                await httpContext.Response.WriteAsJsonAsync(new { message = "You do not have access to this branch." });
                return;
            }

            var resolvedBranchId = hasRequestedBranch ? requestedBranchId : branchAssignments[0];
            httpContext.Items[BranchItemKey] = resolvedBranchId;
        }
        else if (hasRequestedBranch)
        {
            var branchExists = await db.Branches
                .AsNoTracking()
                .AnyAsync(x => x.OrganizationId == resolvedOrganizationId && x.Id == requestedBranchId, httpContext.RequestAborted);
            if (!branchExists)
            {
                httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
                await httpContext.Response.WriteAsJsonAsync(new { message = "Invalid branchId for organization." });
                return;
            }

            httpContext.Items[BranchItemKey] = requestedBranchId;
        }

        httpContext.Items[OrganizationItemKey] = resolvedOrganizationId;
        await next(httpContext);
    }

    private static bool RequiresOrganization(PathString path)
    {
        var value = path.Value ?? string.Empty;
        if (!value.StartsWith("/api", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return !value.StartsWith("/api/auth", StringComparison.OrdinalIgnoreCase)
               && !value.StartsWith("/api/organizations", StringComparison.OrdinalIgnoreCase);
    }
}
