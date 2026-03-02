using Api.Application.Common.Interfaces.Services;
using Api.Application.Features.Customers;

namespace Api.Api.Endpoints;

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
        string organizationId,
        int page,
        int limit,
        string? search,
        bool vipOnly,
        ICustomerService service,
        CancellationToken ct)
    {
        var query = new CustomerListQuery(
            Page: page <= 0 ? 1 : page,
            Limit: limit <= 0 ? 20 : limit,
            Search: search,
            VipOnly: vipOnly);
        var data = await service.GetPagedAsync(organizationId, query, ct);

        return Results.Ok(data);
    }

    private static async Task<IResult> CreateCustomer(
        CreateCustomerRequest request,
        ICustomerService service,
        CancellationToken ct)
    {
        var customer = await service.CreateAsync(request, ct);
        return Results.Created($"/api/customers/{customer.Id}", customer);
    }
}
