using Api.Interfaces;
using Api.Models;

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
        string organizationId,
        int? branchId,
        DateTime? from,
        DateTime? to,
        string? status,
        string? search,
        int page,
        int limit,
        IBookingService service,
        CancellationToken ct)
    {
        var query = new BookingListQuery(
            BranchId: branchId,
            From: from,
            To: to,
            Status: status,
            Search: search,
            Page: page <= 0 ? 1 : page,
            Limit: limit <= 0 ? 20 : limit);
        var data = await service.GetPagedAsync(organizationId, query, ct);

        return Results.Ok(data);
    }

    private static async Task<IResult> CreateBooking(
        CreateBookingRequest request,
        IBookingService service,
        CancellationToken ct)
    {
        try
        {
            var booking = await service.CreateAsync(request, ct);
            return Results.Created($"/api/bookings/{booking.Id}", booking);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
    }
}
