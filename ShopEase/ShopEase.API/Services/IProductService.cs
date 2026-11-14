using ShopEase.API.DTOs;
using ShopEase.API.Models;

namespace ShopEase.API.Services
{
    public interface IProductService
    {
        IReadOnlyList<Product> GetAll();

        Product? GetById(int id);

        Product Create(CreateProductRequest request);

        Product? Update(int id, UpdateProductRequest request);

        bool Delete(int id);
    }
}
