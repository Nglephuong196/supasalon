using Api.Models;
using Api.Dtos;

namespace Api.Models;

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
