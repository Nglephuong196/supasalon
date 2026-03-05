using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class ServicesEndpoints
{
    public static IEndpointRouteBuilder MapServicesEndpoints(this IEndpointRouteBuilder app)
    {
        var services = app.MapGroup("/api").RequireAuthorization();

        services.MapGet("/service-categories", ListCategories);
        services.MapPost("/service-categories", CreateCategory);
        services.MapPut("/service-categories/{id:int}", UpdateCategory);
        services.MapDelete("/service-categories/{id:int}", DeleteCategory);

        services.MapGet("/services", ListServices);
        services.MapPost("/services", CreateService);
        services.MapPut("/services/{id:int}", UpdateService);
        services.MapDelete("/services/{id:int}", DeleteService);

        return app;
    }

    private sealed record ServiceCategoryPayload(string Name, string? Description = null);
    private sealed record ServicePayload(string Name, int CategoryId, double Price, int Duration, string? Description = null);
    private sealed record ServiceUpdatePayload(string? Name, int? CategoryId, double? Price, int? Duration, string? Description = null);

    private static async Task<IResult> ListCategories(HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var data = await db.ServiceCategories
            .AsNoTracking()
            .Where(x => x.OrganizationId == validation.OrganizationId)
            .OrderBy(x => x.Name)
            .Select(x => new { id = x.Id, name = x.Name })
            .ToListAsync(ct);

        return Results.Ok(data);
    }

    private static async Task<IResult> CreateCategory(ServiceCategoryPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = await OrganizationRequestHelper.ValidateResolveAndEnsureOrganizationAsync(httpContext, db, ct: ct);
        if (!validation.IsValid) return validation.Error!;

        var entity = new ServiceCategory
        {
            OrganizationId = validation.OrganizationId!,
            Name = payload.Name,
            Description = payload.Description,
            CreatedAt = DateTime.UtcNow
        };

        db.ServiceCategories.Add(entity);
        await db.SaveChangesAsync(ct);
        return Results.Created($"/api/service-categories/{entity.Id}", new { id = entity.Id, name = entity.Name });
    }

    private static async Task<IResult> UpdateCategory(int id, ServiceCategoryPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.ServiceCategories
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);

        if (entity is null) return Results.NotFound(new { message = "Service category not found" });

        entity.Name = payload.Name;
        entity.Description = payload.Description;
        await db.SaveChangesAsync(ct);

        return Results.Ok(new { id = entity.Id, name = entity.Name });
    }

    private static async Task<IResult> DeleteCategory(int id, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.ServiceCategories
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);

        if (entity is null) return Results.NotFound(new { message = "Service category not found" });

        db.ServiceCategories.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { message = "Deleted" });
    }

    private static async Task<IResult> ListServices(HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var data = await (
            from service in db.Services.AsNoTracking()
            join category in db.ServiceCategories.AsNoTracking() on service.CategoryId equals category.Id
            where category.OrganizationId == validation.OrganizationId
            orderby service.Name
            select new
            {
                id = service.Id,
                name = service.Name,
                categoryId = service.CategoryId,
                price = service.Price,
                duration = service.Duration,
                description = service.Description
            }
        ).ToListAsync(ct);

        return Results.Ok(data);
    }

    private static async Task<IResult> CreateService(ServicePayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = await OrganizationRequestHelper.ValidateResolveAndEnsureOrganizationAsync(httpContext, db, ct: ct);
        if (!validation.IsValid) return validation.Error!;

        var category = await db.ServiceCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == payload.CategoryId, ct);

        if (category is null) return Results.BadRequest(new { message = "Invalid category" });

        var entity = new Service
        {
            Name = payload.Name,
            CategoryId = payload.CategoryId,
            Price = payload.Price,
            Duration = payload.Duration,
            Description = payload.Description,
            CreatedAt = DateTime.UtcNow
        };

        db.Services.Add(entity);
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/services/{entity.Id}", new
        {
            id = entity.Id,
            name = entity.Name,
            categoryId = entity.CategoryId,
            price = entity.Price,
            duration = entity.Duration,
            description = entity.Description
        });
    }

    private static async Task<IResult> UpdateService(int id, ServiceUpdatePayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.Services.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return Results.NotFound(new { message = "Service not found" });

        var category = await db.ServiceCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == entity.CategoryId, ct);
        if (category is null) return Results.NotFound(new { message = "Service not found" });

        var categoryId = payload.CategoryId ?? entity.CategoryId;
        var nextCategory = await db.ServiceCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == categoryId, ct);
        if (nextCategory is null) return Results.BadRequest(new { message = "Invalid category" });

        entity.Name = payload.Name ?? entity.Name;
        entity.CategoryId = categoryId;
        entity.Price = payload.Price ?? entity.Price;
        entity.Duration = payload.Duration ?? entity.Duration;
        entity.Description = payload.Description ?? entity.Description;
        await db.SaveChangesAsync(ct);

        return Results.Ok(new
        {
            id = entity.Id,
            name = entity.Name,
            categoryId = entity.CategoryId,
            price = entity.Price,
            duration = entity.Duration,
            description = entity.Description
        });
    }

    private static async Task<IResult> DeleteService(int id, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.Services.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return Results.NotFound(new { message = "Service not found" });

        var category = await db.ServiceCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == entity.CategoryId, ct);
        if (category is null) return Results.NotFound(new { message = "Service not found" });

        db.Services.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { message = "Deleted" });
    }
}
