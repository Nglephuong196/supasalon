using Api.Models;
using Api.Dtos;
using System.Linq.Expressions;

namespace Api.Models;

public static class CustomerMappings
{
    public static readonly Expression<Func<Customer, CustomerDto>> ToDtoProjection = customer =>
        new CustomerDto(
            customer.Id,
            customer.OrganizationId,
            customer.Name,
            customer.Email,
            customer.Phone,
            customer.Gender,
            customer.Location,
            customer.TotalSpent,
            customer.MembershipTierId,
            customer.CreatedAt);

    public static CustomerDto ToDto(this Customer customer) =>
        new(
            customer.Id,
            customer.OrganizationId,
            customer.Name,
            customer.Email,
            customer.Phone,
            customer.Gender,
            customer.Location,
            customer.TotalSpent,
            customer.MembershipTierId,
            customer.CreatedAt);

    public static Customer ToEntity(this CreateCustomerRequest request, string organizationId) =>
        new()
        {
            OrganizationId = organizationId,
            Name = request.Name,
            Phone = request.Phone,
            Email = request.Email,
            Gender = request.Gender,
            Location = request.Location,
            Notes = request.Notes
        };
}
