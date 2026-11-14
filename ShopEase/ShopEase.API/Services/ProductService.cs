using ShopEase.API.DTOs;
using ShopEase.API.Models;

namespace ShopEase.API.Services
{
    public class ProductService : IProductService
    {
        private readonly object _syncRoot = new();

        private readonly List<Product> _products =
        [
            new Product
            {
                Id = 1,
                Name = "Laptop",
                Description = "Gaming Laptop",
                Price = 250000m,
                Stock = 10
            },
            new Product
            {
                Id = 2,
                Name = "Smartphone",
                Description = "Android Phone",
                Price = 85000m,
                Stock = 20
            }
        ];

        private int _nextId = 3;

        public IReadOnlyList<Product> GetAll()
        {
            lock (_syncRoot)
            {
                return _products.Select(CopyProduct).ToList();
            }
        }

        public Product? GetById(int id)
        {
            lock (_syncRoot)
            {
                var product = _products.FirstOrDefault(product => product.Id == id);
                return product is null ? null : CopyProduct(product);
            }
        }

        public Product Create(CreateProductRequest request)
        {
            lock (_syncRoot)
            {
                var product = new Product
                {
                    Id = _nextId++,
                    Name = request.Name.Trim(),
                    Description = request.Description.Trim(),
                    Price = request.Price,
                    Stock = request.Stock
                };

                _products.Add(product);
                return CopyProduct(product);
            }
        }

        public Product? Update(int id, UpdateProductRequest request)
        {
            lock (_syncRoot)
            {
                var product = _products.FirstOrDefault(product => product.Id == id);

                if (product is null)
                {
                    return null;
                }

                product.Name = request.Name.Trim();
                product.Description = request.Description.Trim();
                product.Price = request.Price;
                product.Stock = request.Stock;

                return CopyProduct(product);
            }
        }

        public bool Delete(int id)
        {
            lock (_syncRoot)
            {
                var product = _products.FirstOrDefault(product => product.Id == id);

                if (product is null)
                {
                    return false;
                }

                _products.Remove(product);
                return true;
            }
        }

        private static Product CopyProduct(Product product)
        {
            return new Product
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                Stock = product.Stock
            };
        }
    }
}
