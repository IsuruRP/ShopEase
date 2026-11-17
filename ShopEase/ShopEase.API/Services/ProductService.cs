using Microsoft.EntityFrameworkCore;
using ShopEase.API.Data;
using ShopEase.API.DTOs;
using ShopEase.API.Models;

namespace ShopEase.API.Services;

public class ProductService : IProductService
{
    private readonly ShopEaseDbContext _db;
    public ProductService(ShopEaseDbContext db) => _db = db;

    public async Task<(IReadOnlyList<Product> Items, int Total)> GetPageAsync(
        ProductQueryRequest request,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Products.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(product => product.Name.Contains(term) || product.Description.Contains(term) ||
                product.Sku.Contains(term) || product.Brand.Contains(term));
        }
        if (request.CategoryId.HasValue) query = query.Where(product => product.CategoryId == request.CategoryId);
        if (!string.IsNullOrWhiteSpace(request.Brand)) query = query.Where(product => product.Brand == request.Brand.Trim());
        if (request.InStockOnly) query = query.Where(product => product.Stock > 0);
        if (request.MinPrice.HasValue) query = query.Where(product => product.Price >= request.MinPrice.Value);
        if (request.MaxPrice.HasValue) query = query.Where(product => product.Price <= request.MaxPrice.Value);

        query = request.Sort.ToLowerInvariant() switch
        {
            "price-low" => query.OrderBy(product => product.Price),
            "price-high" => query.OrderByDescending(product => product.Price),
            "name" => query.OrderBy(product => product.Name),
            "newest" => query.OrderByDescending(product => product.Id),
            _ => query.OrderBy(product => product.Id)
        };

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Include(product => product.Category)
            .Include(product => product.Images)
            .Include(product => product.Variants)
            .Include(product => product.Specifications)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
        return (items, total);
    }

    public Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        ProductGraph().AsNoTracking().SingleOrDefaultAsync(product => product.Id == id, cancellationToken);

    public async Task<Product> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureSkusAvailable(request.Sku, request.Variants, null, cancellationToken);
        var category = await GetCategoryAsync(request.CategoryId, cancellationToken);
        var product = new Product
        {
            Name = request.Name.Trim(), Description = request.Description.Trim(), Sku = NormalizeSku(request.Sku),
            Brand = request.Brand.Trim(), Price = request.Price, Stock = request.Variants.Count > 0 ? request.Variants.Sum(item => item.Stock) : request.Stock,
            CategoryId = category.Id, Category = category
        };
        AddChildren(product, request.Variants, request.Specifications);
        _db.Products.Add(product);
        await _db.SaveChangesAsync(cancellationToken);
        return product;
    }

    public async Task<Product?> UpdateAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken = default)
    {
        var product = await ProductGraph().SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (product is null) return null;
        await EnsureSkusAvailable(request.Sku, request.Variants, id, cancellationToken);
        var category = product.CategoryId == request.CategoryId ? product.Category : await GetCategoryAsync(request.CategoryId, cancellationToken);

        product.Name = request.Name.Trim(); product.Description = request.Description.Trim();
        product.Sku = NormalizeSku(request.Sku); product.Brand = request.Brand.Trim(); product.Price = request.Price;
        product.Stock = request.Variants.Count > 0 ? request.Variants.Sum(item => item.Stock) : request.Stock;
        product.CategoryId = category.Id; product.Category = category;

        _db.ProductVariants.RemoveRange(product.Variants);
        _db.ProductSpecifications.RemoveRange(product.Specifications);
        product.Variants.Clear(); product.Specifications.Clear();
        AddChildren(product, request.Variants, request.Specifications);
        await _db.SaveChangesAsync(cancellationToken);
        return product;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await _db.Products.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (product is null) return false;
        _db.Products.Remove(product);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private IQueryable<Product> ProductGraph() => _db.Products
        .Include(product => product.Category).Include(product => product.Images)
        .Include(product => product.Variants).Include(product => product.Specifications).AsSplitQuery();

    private static void AddChildren(Product product, IEnumerable<ProductVariantRequest> variants, IEnumerable<ProductSpecificationRequest> specifications)
    {
        foreach (var item in variants) product.Variants.Add(new ProductVariant
        {
            Name = item.Name.Trim(), Sku = NormalizeSku(item.Sku), Price = item.Price, Stock = item.Stock, IsActive = item.IsActive
        });
        var sort = 0;
        foreach (var item in specifications) product.Specifications.Add(new ProductSpecification
        {
            Name = item.Name.Trim(), Value = item.Value.Trim(), SortOrder = sort++
        });
    }

    private async Task EnsureSkusAvailable(string productSku, IReadOnlyCollection<ProductVariantRequest> variants, int? productId, CancellationToken token)
    {
        var skus = variants.Select(item => NormalizeSku(item.Sku)).Append(NormalizeSku(productSku)).ToList();
        if (skus.Distinct(StringComparer.OrdinalIgnoreCase).Count() != skus.Count)
            throw new InvalidOperationException("Product and variant SKUs must be unique.");
        if (await _db.Products.AnyAsync(item => item.Id != productId && skus.Contains(item.Sku), token) ||
            await _db.ProductVariants.AnyAsync(item => item.ProductId != productId && skus.Contains(item.Sku), token))
            throw new InvalidOperationException("One or more SKUs are already in use.");
    }

    private async Task<Category> GetCategoryAsync(int id, CancellationToken token) =>
        await _db.Categories.SingleOrDefaultAsync(item => item.Id == id, token)
        ?? throw new KeyNotFoundException($"Category with ID {id} was not found.");

    private static string NormalizeSku(string value) => value.Trim().ToUpperInvariant();
}
