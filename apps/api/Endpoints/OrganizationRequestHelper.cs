using Api.Data;
using Api.Middleware;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class OrganizationRequestHelper
{
    public static (bool IsValid, string? OrganizationId, IResult? Error) ValidateAndResolve(
        HttpContext httpContext,
        string? requestOrganizationId = null)
    {
        var resolvedOrganizationId = ReadResolvedOrganizationId(httpContext);
        if (string.IsNullOrWhiteSpace(resolvedOrganizationId))
        {
            return (
                false,
                null,
                Results.BadRequest(new { message = "Unable to resolve organization context for current user." }));
        }

        if (!string.IsNullOrWhiteSpace(requestOrganizationId) &&
            !string.Equals(resolvedOrganizationId, requestOrganizationId.Trim(), StringComparison.Ordinal))
        {
            return (
                false,
                null,
                Results.BadRequest(new { message = "organizationId mismatch between request context and request payload." }));
        }

        return (true, resolvedOrganizationId, null);
    }

    public static async Task<(bool IsValid, string? OrganizationId, IResult? Error)> ValidateResolveAndEnsureOrganizationAsync(
        HttpContext httpContext,
        AppDbContext db,
        string? requestOrganizationId = null,
        CancellationToken ct = default)
    {
        var validation = ValidateAndResolve(httpContext, requestOrganizationId);
        if (!validation.IsValid)
        {
            return validation;
        }

        var organizationId = validation.OrganizationId!;
        var organizationExists = await db.Organizations
            .AsNoTracking()
            .AnyAsync(x => x.Id == organizationId, ct);

        if (!organizationExists)
        {
            return (
                false,
                null,
                Results.BadRequest(new { message = "Invalid organizationId. Organization does not exist." }));
        }

        return (true, organizationId, null);
    }

    private static string? ReadResolvedOrganizationId(HttpContext httpContext)
    {
        if (httpContext.Items.TryGetValue(OrganizationContextMiddleware.OrganizationItemKey, out var value) &&
            value is string organizationId &&
            !string.IsNullOrWhiteSpace(organizationId))
        {
            return organizationId;
        }

        return null;
    }
}
