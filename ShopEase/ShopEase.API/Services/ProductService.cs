using Microsoft.EntityFrameworkCore;
using ShopEase.API.Data;
using ShopEase.API.DTOs;
using ShopEase.API.Models;

namespace ShopEase.API.Services
{
    public class ProductService : IProductService
    {
        private readonly ShopEaseDbContext _dbContext;

        public ProductService(ShopEaseDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<IReadOnlyList<Product>> GetAllAsync(
            CancellationToken cancellationToken = default)
        {
            return await _dbContext.Products
                .AsNoTracking()
                .Include(product => product.Category)
                .OrderBy(product => product.Id)
                .ToListAsync(cancellationToken);
        }

        public async Task<Product?> GetByIdAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            return await _dbContext.Products
                .AsNoTracking()
                .Include(product => product.Category)
                .SingleOrDefaultAsync(product => product.Id == id, cancellationToken);
        }

        public async Task<Product> CreateAsync(
            CreateProductRequest request,
            CancellationToken cancellationToken = default)
        {
            var category = await GetCategoryAsync(request.CategoryId, cancellationToken);

            var product = new Product
            {
                Name = request.Name.Trim(),
                Description = request.Description.Trim(),
                Price = request.Price,
                Stock = request.Stock,
                CategoryId = category.Id,
                Category = category
            };

            _dbContext.Products.Add(product);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return product;
        }

        public async Task<Product?> UpdateAsync(
            int id,
            UpdateProductRequest request,
            CancellationToken cancellationToken = default)
        {
            var product = await _dbContext.Products
                .Include(product => product.Category)
                .SingleOrDefaultAsync(product => product.Id == id, cancellationToken);

            if (product is null)
            {
                return null;
            }

            var category = product.CategoryId == request.CategoryId
                ? product.Category
                : await GetCategoryAsync(request.CategoryId, cancellationToken);

            product.Name = request.Name.Trim();
            product.Description = request.Description.Trim();
            product.Price = request.Price;
            product.Stock = request.Stock;
            product.CategoryId = category.Id;
            product.Category = category;

            await _dbContext.SaveChangesAsync(cancellationToken);

            return product;
        }

        public async Task<bool> DeleteAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            var product = await _dbContext.Products
                .SingleOrDefaultAsync(product => product.Id == id, cancellationToken);

            if (product is null)
            {
                return false;
            }

            _dbContext.Products.Remove(product);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return true;
        }

        private async Task<Category> GetCategoryAsync(
            int categoryId,
            CancellationToken cancellationToken)
        {
            var category = await _dbContext.Categories
                .SingleOrDefaultAsync(category => category.Id == categoryId, cancellationToken);

            return category ?? throw new KeyNotFoundException(
                $"Category with ID {categoryId} was not found.");
        }
    }
}
