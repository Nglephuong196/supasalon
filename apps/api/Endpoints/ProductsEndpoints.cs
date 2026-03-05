using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class ProductsEndpoints
{
    public static IEndpointRouteBuilder MapProductsEndpoints(this IEndpointRouteBuilder app)
    {
        var products = app.MapGroup("/api").RequireAuthorization();

        products.MapGet("/product-categories", ListCategories);
        products.MapPost("/product-categories", CreateCategory);
        products.MapPut("/product-categories/{id:int}", UpdateCategory);
        products.MapDelete("/product-categories/{id:int}", DeleteCategory);

        products.MapGet("/products", ListProducts);
        products.MapPost("/products", CreateProduct);
        products.MapPut("/products/{id:int}", UpdateProduct);
        products.MapDelete("/products/{id:int}", DeleteProduct);

        return app;
    }

    private sealed record ProductCategoryPayload(string Name, string? Description = null);
    private sealed record ProductPayload(string Name, int CategoryId, double Price, int Stock, int MinStock, string? Sku = null, string? Description = null);
    private sealed record ProductUpdatePayload(string? Name, int? CategoryId, double? Price, int? Stock, int? MinStock, string? Sku = null, string? Description = null);

    private static async Task<IResult> ListCategories(HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var data = await db.ProductCategories
            .AsNoTracking()
            .Where(x => x.OrganizationId == validation.OrganizationId)
            .OrderBy(x => x.Name)
            .Select(x => new { id = x.Id, name = x.Name })
            .ToListAsync(ct);

        return Results.Ok(data);
    }

    private static async Task<IResult> CreateCategory(ProductCategoryPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = await OrganizationRequestHelper.ValidateResolveAndEnsureOrganizationAsync(httpContext, db, ct: ct);
        if (!validation.IsValid) return validation.Error!;

        var entity = new ProductCategory
        {
            OrganizationId = validation.OrganizationId!,
            Name = payload.Name,
            Description = payload.Description,
            CreatedAt = DateTime.UtcNow
        };

        db.ProductCategories.Add(entity);
        await db.SaveChangesAsync(ct);
        return Results.Created($"/api/product-categories/{entity.Id}", new { id = entity.Id, name = entity.Name });
    }

    private static async Task<IResult> UpdateCategory(int id, ProductCategoryPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.ProductCategories
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);

        if (entity is null) return Results.NotFound(new { message = "Product category not found" });

        entity.Name = payload.Name;
        entity.Description = payload.Description;
        await db.SaveChangesAsync(ct);

        return Results.Ok(new { id = entity.Id, name = entity.Name });
    }

    private static async Task<IResult> DeleteCategory(int id, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.ProductCategories
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == id, ct);

        if (entity is null) return Results.NotFound(new { message = "Product category not found" });

        db.ProductCategories.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { message = "Deleted" });
    }

    private static async Task<IResult> ListProducts(HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var data = await (
            from product in db.Products.AsNoTracking()
            join category in db.ProductCategories.AsNoTracking() on product.CategoryId equals category.Id
            where category.OrganizationId == validation.OrganizationId
            orderby product.Name
            select new
            {
                id = product.Id,
                name = product.Name,
                categoryId = product.CategoryId,
                price = product.Price,
                stock = product.Stock,
                minStock = product.MinStock,
                sku = product.Sku,
                description = product.Description
            }
        ).ToListAsync(ct);

        return Results.Ok(data);
    }

    private static async Task<IResult> CreateProduct(ProductPayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = await OrganizationRequestHelper.ValidateResolveAndEnsureOrganizationAsync(httpContext, db, ct: ct);
        if (!validation.IsValid) return validation.Error!;

        var category = await db.ProductCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == payload.CategoryId, ct);

        if (category is null) return Results.BadRequest(new { message = "Invalid category" });

        var entity = new Product
        {
            Name = payload.Name,
            CategoryId = payload.CategoryId,
            Price = payload.Price,
            Stock = payload.Stock,
            MinStock = payload.MinStock,
            Sku = payload.Sku,
            Description = payload.Description,
            CreatedAt = DateTime.UtcNow
        };

        db.Products.Add(entity);
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/products/{entity.Id}", new
        {
            id = entity.Id,
            name = entity.Name,
            categoryId = entity.CategoryId,
            price = entity.Price,
            stock = entity.Stock,
            minStock = entity.MinStock,
            sku = entity.Sku,
            description = entity.Description
        });
    }

    private static async Task<IResult> UpdateProduct(int id, ProductUpdatePayload payload, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.Products.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return Results.NotFound(new { message = "Product not found" });

        var currentCategory = await db.ProductCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == entity.CategoryId, ct);
        if (currentCategory is null) return Results.NotFound(new { message = "Product not found" });

        var categoryId = payload.CategoryId ?? entity.CategoryId;
        var nextCategory = await db.ProductCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == categoryId, ct);
        if (nextCategory is null) return Results.BadRequest(new { message = "Invalid category" });

        entity.Name = payload.Name ?? entity.Name;
        entity.CategoryId = categoryId;
        entity.Price = payload.Price ?? entity.Price;
        entity.Stock = payload.Stock ?? entity.Stock;
        entity.MinStock = payload.MinStock ?? entity.MinStock;
        entity.Sku = payload.Sku ?? entity.Sku;
        entity.Description = payload.Description ?? entity.Description;
        await db.SaveChangesAsync(ct);

        return Results.Ok(new
        {
            id = entity.Id,
            name = entity.Name,
            categoryId = entity.CategoryId,
            price = entity.Price,
            stock = entity.Stock,
            minStock = entity.MinStock,
            sku = entity.Sku,
            description = entity.Description
        });
    }

    private static async Task<IResult> DeleteProduct(int id, HttpContext httpContext, AppDbContext db, CancellationToken ct)
    {
        var validation = OrganizationRequestHelper.ValidateAndResolve(httpContext);
        if (!validation.IsValid) return validation.Error!;

        var entity = await db.Products.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return Results.NotFound(new { message = "Product not found" });

        var category = await db.ProductCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationId == validation.OrganizationId && x.Id == entity.CategoryId, ct);
        if (category is null) return Results.NotFound(new { message = "Product not found" });

        db.Products.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { message = "Deleted" });
    }
}
