using Api.Domain.Entities;

namespace Api.Application.Features.Auth;

public static class UserMappings
{
    public static CurrentUserDto ToCurrentUserDto(this User user) =>
        new(
            user.Id,
            user.Email,
            user.Name,
            user.Image,
            user.CreatedAt,
            user.UpdatedAt);
}
