using Api.Interfaces;
using Api.Models;
using Api.Utils;

namespace Api.Endpoints;

public static class CustomerEndpoints
{
    public static IEndpointRouteBuilder MapCustomerEndpoints(this IEndpointRouteBuilder app)
    {
        var customers = app.MapGroup("/api/customers").RequireAuthorization();

        customers.MapGet("/", GetCustomers);
        customers.MapPost("/", CreateCustomer);

        return app;
    }

    private static async Task<IResult> GetCustomers(
        int? page,
        int? limit,
        string? search,
        bool? vipOnly,
        HttpContext httpContext,
        ICustomerService service,
        CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid)
        {
            return validation.Error!;
        }

        var organizationId = validation.OrganizationId!;
        var query = new CustomerListQuery(
            Page: PaginationDefaults.Page(page),
            Limit: PaginationDefaults.Limit(limit),
            Search: search,
            VipOnly: vipOnly ?? false);
        var data = await service.GetPagedAsync(organizationId, query, ct);

        return Results.Ok(data);
    }

    private static async Task<IResult> CreateCustomer(
        CreateCustomerRequest request,
        HttpContext httpContext,
        ICustomerService service,
        CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid)
        {
            return validation.Error!;
        }

        var customer = await service.CreateAsync(validation.OrganizationId!, request, ct);
        return Results.Created($"/api/customers/{customer.Id}", customer);
    }
}
