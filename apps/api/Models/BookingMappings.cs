using Api.Models;
using Api.Dtos;
using System.Linq.Expressions;

namespace Api.Models;

public static class BookingMappings
{
    public static readonly Expression<Func<Booking, BookingDto>> ToDtoProjection = booking =>
        new BookingDto(
            booking.Id,
            booking.OrganizationId,
            booking.CustomerId,
            booking.BranchId,
            booking.Date,
            booking.Status,
            booking.DepositAmount,
            booking.DepositPaid,
            booking.GuestCount,
            booking.Notes,
            booking.Guests,
            booking.CreatedAt);

    public static BookingDto ToDto(this Booking booking) =>
        new(
            booking.Id,
            booking.OrganizationId,
            booking.CustomerId,
            booking.BranchId,
            booking.Date,
            booking.Status,
            booking.DepositAmount,
            booking.DepositPaid,
            booking.GuestCount,
            booking.Notes,
            booking.Guests,
            booking.CreatedAt);

    public static Booking ToEntity(this CreateBookingRequest request) =>
        new()
        {
            OrganizationId = request.OrganizationId,
            CustomerId = request.CustomerId,
            BranchId = request.BranchId,
            Date = request.Date,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "pending" : request.Status,
            DepositAmount = request.DepositAmount ?? 0,
            DepositPaid = request.DepositPaid ?? 0,
            GuestCount = request.GuestCount ?? 1,
            Notes = request.Notes,
            Guests = request.Guests,
            CreatedAt = DateTime.UtcNow
        };
}
