namespace Api.Endpoints;

public static class EndpointRouteBuilderExtensions
{
    public static IEndpointRouteBuilder MapFeatureEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapAuthEndpoints();
        app.MapOrganizationsEndpoints();
        app.MapDashboardEndpoints();
        app.MapCustomerEndpoints();
        app.MapBookingEndpoints();
        app.MapInvoiceEndpoints();
        app.MapMembersEndpoints();
        app.MapServicesEndpoints();
        app.MapProductsEndpoints();
        app.MapBranchesEndpoints();
        app.MapSettingsEndpoints();
        app.MapPrepaidEndpoints();
        app.MapPayrollEndpoints();
        app.MapBookingRemindersEndpoints();
        app.MapApprovalsEndpoints();
        app.MapCashManagementEndpoints();

        return app;
    }
}
