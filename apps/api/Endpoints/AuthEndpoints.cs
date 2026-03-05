using Api.Models;
using Api.Dtos;
using Api.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;

namespace Api.Endpoints;

public static class AuthEndpoints
{
    private static readonly Regex SlugRegex = new("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);

    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/api/auth");

        auth.MapPost("/register", Register);
        auth.MapPost("/login", Login);
        auth.MapGet("/me", Me).RequireAuthorization();

        return app;
    }

    private static async Task<IResult> Register(
        RegisterRequest request,
        UserManager<User> userManager,
        AppDbContext db,
        IOptions<JwtOptions> jwtOptionsAccessor)
    {
        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            return Results.Conflict(new { message = "Email is already registered." });
        }

        var organizationName = string.IsNullOrWhiteSpace(request.SalonName)
            ? "Salon của tôi"
            : request.SalonName.Trim();
        var organizationSlug = string.IsNullOrWhiteSpace(request.SalonSlug)
            ? NormalizeSlug(organizationName)
            : NormalizeSlug(request.SalonSlug);

        if (string.IsNullOrWhiteSpace(organizationSlug) || !SlugRegex.IsMatch(organizationSlug))
        {
            return Results.BadRequest(new
            {
                message = "Slug chỉ gồm chữ thường, số và dấu gạch ngang (không ở đầu/cuối)."
            });
        }

        var slugTaken = await db.Organizations.AsNoTracking().AnyAsync(x => x.Slug == organizationSlug);
        if (slugTaken)
        {
            return Results.Conflict(new { message = "Slug is already taken." });
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

        try
        {
            var now = DateTime.UtcNow;

            var organization = new Organization
            {
                Id = Guid.NewGuid().ToString("N"),
                Name = organizationName,
                Slug = organizationSlug,
                CreatedAt = now
            };
            db.Organizations.Add(organization);

            var member = new Member
            {
                Id = Guid.NewGuid().ToString("N"),
                OrganizationId = organization.Id,
                UserId = user.Id,
                Role = "owner",
                CreatedAt = now
            };
            db.Members.Add(member);

            var branchAddress = BuildBranchAddress(request.Address, request.Province);
            var mainBranch = new Branch
            {
                OrganizationId = organization.Id,
                Name = "Chi nhánh chính",
                Address = branchAddress,
                Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
                ManagerMemberId = member.Id,
                IsActive = true,
                IsDefault = true,
                CreatedAt = now,
                UpdatedAt = now
            };
            db.Branches.Add(mainBranch);

            await db.SaveChangesAsync();

            db.MemberBranches.Add(new MemberBranch
            {
                OrganizationId = organization.Id,
                BranchId = mainBranch.Id,
                MemberId = member.Id,
                IsPrimary = true,
                CreatedAt = now
            });
            await db.SaveChangesAsync();

            var jwtOptions = jwtOptionsAccessor.Value;
            var expiresAt = now.AddMinutes(jwtOptions.AccessTokenExpiryMinutes);
            var token = CreateAccessToken(user, jwtOptions, expiresAt);

            return Results.Ok(new RegisterResponse(token, expiresAt, organization.Id, mainBranch.Id));
        }
        catch
        {
            await userManager.DeleteAsync(user);
            return Results.Problem("Registration failed while creating organization and main branch.");
        }
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

    private static string NormalizeSlug(string value)
    {
        var normalized = value
            .Trim()
            .ToLowerInvariant();
        normalized = Regex.Replace(normalized, @"\s+", "-");
        normalized = Regex.Replace(normalized, @"[^a-z0-9-]", "");
        normalized = Regex.Replace(normalized, @"-+", "-");
        return normalized.Trim('-');
    }

    private static string? BuildBranchAddress(string? address, string? province)
    {
        var trimmedAddress = string.IsNullOrWhiteSpace(address) ? null : address.Trim();
        var trimmedProvince = string.IsNullOrWhiteSpace(province) ? null : province.Trim();

        if (trimmedAddress is not null && trimmedProvince is not null)
        {
            return $"{trimmedAddress}, {trimmedProvince}";
        }

        return trimmedAddress ?? trimmedProvince;
    }
}
