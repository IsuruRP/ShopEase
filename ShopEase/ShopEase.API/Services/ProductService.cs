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
                .OrderBy(product => product.Id)
                .ToListAsync(cancellationToken);
        }

        public async Task<Product?> GetByIdAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            return await _dbContext.Products
                .AsNoTracking()
                .SingleOrDefaultAsync(product => product.Id == id, cancellationToken);
        }

        public async Task<Product> CreateAsync(
            CreateProductRequest request,
            CancellationToken cancellationToken = default)
        {
            var product = new Product
            {
                Name = request.Name.Trim(),
                Description = request.Description.Trim(),
                Price = request.Price,
                Stock = request.Stock
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
                .SingleOrDefaultAsync(product => product.Id == id, cancellationToken);

            if (product is null)
            {
                return null;
            }

            product.Name = request.Name.Trim();
            product.Description = request.Description.Trim();
            product.Price = request.Price;
            product.Stock = request.Stock;

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
    }
}
