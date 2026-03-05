using Api.Interfaces;
using Api.Models;
using Api.Utils;

namespace Api.Endpoints;

public static class BookingEndpoints
{
    public static IEndpointRouteBuilder MapBookingEndpoints(this IEndpointRouteBuilder app)
    {
        var bookings = app.MapGroup("/api/bookings").RequireAuthorization();

        bookings.MapGet("/", GetBookings);
        bookings.MapPost("/", CreateBooking);

        return app;
    }

    private static async Task<IResult> GetBookings(
        int? branchId,
        DateTime? from,
        DateTime? to,
        string? status,
        string? search,
        int? page,
        int? limit,
        HttpContext httpContext,
        IBookingService service,
        CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid)
        {
            return validation.Error!;
        }

        var organizationId = validation.OrganizationId!;
        var utcFrom = UtcDateTime.EnsureUtc(from);
        var utcTo = UtcDateTime.EnsureUtc(to);
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        var effectiveBranchId = resolvedBranchId ?? branchId;
        var query = new BookingListQuery(
            BranchId: effectiveBranchId,
            From: utcFrom,
            To: utcTo,
            Status: status,
            Search: search,
            Page: PaginationDefaults.Page(page),
            Limit: PaginationDefaults.Limit(limit));
        var data = await service.GetPagedAsync(organizationId, query, ct);

        return Results.Ok(data);
    }

    private static async Task<IResult> CreateBooking(
        CreateBookingRequest request,
        HttpContext httpContext,
        IBookingService service,
        CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid)
        {
            return validation.Error!;
        }

        var organizationId = validation.OrganizationId!;
        var resolvedBranchId = BranchRequestHelper.ReadResolvedBranchId(httpContext);
        if (resolvedBranchId is int branchId)
        {
            if (request.BranchId is int requestedBranchId && requestedBranchId != branchId)
            {
                return Results.BadRequest(new { message = "branchId mismatch between header and request payload." });
            }

            request = request with { BranchId = branchId };
        }
        try
        {
            var booking = await service.CreateAsync(organizationId, request, ct);
            return Results.Created($"/api/bookings/{booking.Id}", booking);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
    }
}
