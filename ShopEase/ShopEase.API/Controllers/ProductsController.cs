using Microsoft.AspNetCore.Mvc;
using ShopEase.API.DTOs;
using ShopEase.API.Models;
using ShopEase.API.Services;

namespace ShopEase.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductsController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpGet]
        public ActionResult<IEnumerable<ProductResponse>> GetProducts()
        {
            var products = _productService.GetAll().Select(ToResponse);
            return Ok(products);
        }

        [HttpGet("{id:int}")]
        public ActionResult<ProductResponse> GetProduct(int id)
        {
            var product = _productService.GetById(id);

            if (product is null)
            {
                return NotFound(new { message = $"Product with ID {id} was not found." });
            }

            return Ok(ToResponse(product));
        }

        [HttpPost]
        public ActionResult<ProductResponse> CreateProduct(CreateProductRequest request)
        {
            var product = _productService.Create(request);
            var response = ToResponse(product);

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, response);
        }

        [HttpPut("{id:int}")]
        public IActionResult UpdateProduct(int id, UpdateProductRequest request)
        {
            var product = _productService.Update(id, request);

            if (product is null)
            {
                return NotFound(new { message = $"Product with ID {id} was not found." });
            }

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public IActionResult DeleteProduct(int id)
        {
            var wasDeleted = _productService.Delete(id);

            if (!wasDeleted)
            {
                return NotFound(new { message = $"Product with ID {id} was not found." });
            }

            return NoContent();
        }

        private static ProductResponse ToResponse(Product product)
        {
            return new ProductResponse
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
