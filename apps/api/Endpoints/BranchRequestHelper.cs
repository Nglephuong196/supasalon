using Api.Middleware;

namespace Api.Endpoints;

public static class BranchRequestHelper
{
    public static int? ReadResolvedBranchId(HttpContext httpContext)
    {
        if (httpContext.Items.TryGetValue(OrganizationContextMiddleware.BranchItemKey, out var value) &&
            value is int branchId)
        {
            return branchId;
        }

        return null;
    }
}
