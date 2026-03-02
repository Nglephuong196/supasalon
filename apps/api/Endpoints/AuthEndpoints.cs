using Api.Models;
using Api.Dtos;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/api/auth");

        auth.MapPost("/register", Register);
        auth.MapPost("/login", Login);
        auth.MapGet("/me", Me).RequireAuthorization();

        return app;
    }

    private static async Task<IResult> Register(RegisterRequest request, UserManager<User> userManager)
    {
        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            return Results.Conflict(new { message = "Email is already registered." });
        }

        var user = new User
        {
            UserName = request.Email,
            Email = request.Email,
            Name = request.Name,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return Results.BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        return Results.Ok(new { message = "Registration succeeded." });
    }

    private static async Task<IResult> Login(
        LoginRequest request,
        SignInManager<User> signInManager,
        UserManager<User> userManager,
        IOptions<JwtOptions> jwtOptionsAccessor)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            return Results.Unauthorized();
        }

        user.UpdatedAt = DateTime.UtcNow;
        await userManager.UpdateAsync(user);

        var jwtOptions = jwtOptionsAccessor.Value;
        var now = DateTime.UtcNow;
        var expiresAt = now.AddMinutes(jwtOptions.AccessTokenExpiryMinutes);
        var token = CreateAccessToken(user, jwtOptions, expiresAt);

        return Results.Ok(new AuthResponse(token, expiresAt));
    }

    private static async Task<IResult> Me(ClaimsPrincipal principal, UserManager<User> userManager)
    {
        var user = await userManager.GetUserAsync(principal);
        if (user is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(user.ToCurrentUserDto());
    }

    private static string CreateAccessToken(User user, JwtOptions jwtOptions, DateTime expiresAt)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName ?? user.Email ?? user.Id)
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtOptions.Issuer,
            audience: jwtOptions.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
