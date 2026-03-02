namespace Api.Endpoints;

public static class EndpointRouteBuilderExtensions
{
    public static IEndpointRouteBuilder MapFeatureEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapAuthEndpoints();
        app.MapCustomerEndpoints();
        app.MapBookingEndpoints();
        app.MapInvoiceEndpoints();

        return app;
    }
}
