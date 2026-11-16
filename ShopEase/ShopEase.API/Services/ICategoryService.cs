using ShopEase.API.DTOs;
using ShopEase.API.Models;

namespace ShopEase.API.Services;

public interface ICategoryService
{
    Task<IReadOnlyList<Category>> GetAllAsync(
        CancellationToken cancellationToken = default);

    Task<Category?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<Category> CreateAsync(
        CreateCategoryRequest request,
        CancellationToken cancellationToken = default);

    Task<Category?> UpdateAsync(
        int id,
        UpdateCategoryRequest request,
        CancellationToken cancellationToken = default);

    Task<CategoryDeleteResult> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default);
}
