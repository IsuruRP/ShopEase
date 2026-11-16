using Microsoft.EntityFrameworkCore;
using ShopEase.API.Data;
using ShopEase.API.DTOs;
using ShopEase.API.Models;

namespace ShopEase.API.Services;

public class CategoryService : ICategoryService
{
    private readonly ShopEaseDbContext _dbContext;

    public CategoryService(ShopEaseDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Category>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Categories
            .AsNoTracking()
            .Include(category => category.Products)
            .OrderBy(category => category.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Category?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Categories
            .AsNoTracking()
            .Include(category => category.Products)
            .SingleOrDefaultAsync(category => category.Id == id, cancellationToken);
    }

    public async Task<Category> CreateAsync(
        CreateCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var category = new Category
        {
            Name = request.Name.Trim(),
            Description = request.Description.Trim()
        };

        _dbContext.Categories.Add(category);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return category;
    }

    public async Task<Category?> UpdateAsync(
        int id,
        UpdateCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var category = await _dbContext.Categories
            .SingleOrDefaultAsync(category => category.Id == id, cancellationToken);

        if (category is null)
        {
            return null;
        }

        category.Name = request.Name.Trim();
        category.Description = request.Description.Trim();

        await _dbContext.SaveChangesAsync(cancellationToken);

        return category;
    }

    public async Task<CategoryDeleteResult> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var category = await _dbContext.Categories
            .Include(category => category.Products)
            .SingleOrDefaultAsync(category => category.Id == id, cancellationToken);

        if (category is null)
        {
            return CategoryDeleteResult.NotFound;
        }

        if (category.Products.Count > 0)
        {
            return CategoryDeleteResult.HasProducts;
        }

        _dbContext.Categories.Remove(category);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CategoryDeleteResult.Deleted;
    }
}
