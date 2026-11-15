using ShopEase.API.DTOs;
using ShopEase.API.Models;

namespace ShopEase.API.Services
{
    public interface IProductService
    {
        Task<IReadOnlyList<Product>> GetAllAsync(
            CancellationToken cancellationToken = default);

        Task<Product?> GetByIdAsync(
            int id,
            CancellationToken cancellationToken = default);

        Task<Product> CreateAsync(
            CreateProductRequest request,
            CancellationToken cancellationToken = default);

        Task<Product?> UpdateAsync(
            int id,
            UpdateProductRequest request,
            CancellationToken cancellationToken = default);

        Task<bool> DeleteAsync(
            int id,
            CancellationToken cancellationToken = default);
    }
}
