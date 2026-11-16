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
        public async Task<ActionResult<IEnumerable<ProductResponse>>> GetProducts(
            CancellationToken cancellationToken)
        {
            var products = (await _productService.GetAllAsync(cancellationToken))
                .Select(ToResponse);

            return Ok(products);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ProductResponse>> GetProduct(
            int id,
            CancellationToken cancellationToken)
        {
            var product = await _productService.GetByIdAsync(id, cancellationToken);

            if (product is null)
            {
                return NotFound(new { message = $"Product with ID {id} was not found." });
            }

            return Ok(ToResponse(product));
        }

        [HttpPost]
        public async Task<ActionResult<ProductResponse>> CreateProduct(
            CreateProductRequest request,
            CancellationToken cancellationToken)
        {
            var product = await _productService.CreateAsync(request, cancellationToken);
            var response = ToResponse(product);

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, response);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateProduct(
            int id,
            UpdateProductRequest request,
            CancellationToken cancellationToken)
        {
            var product = await _productService.UpdateAsync(id, request, cancellationToken);

            if (product is null)
            {
                return NotFound(new { message = $"Product with ID {id} was not found." });
            }

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteProduct(
            int id,
            CancellationToken cancellationToken)
        {
            var wasDeleted = await _productService.DeleteAsync(id, cancellationToken);

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
                Stock = product.Stock,
                CategoryId = product.CategoryId,
                CategoryName = product.Category.Name
            };
        }
    }
}
