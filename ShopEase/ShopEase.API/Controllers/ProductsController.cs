using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopEase.API.Data;
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
        private readonly ShopEaseDbContext _db;
        private readonly IWebHostEnvironment _environment;

        public ProductsController(IProductService productService, ShopEaseDbContext db, IWebHostEnvironment environment)
        {
            _productService = productService;
            _db = db;
            _environment = environment;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResponse<ProductResponse>>> GetProducts(
            [FromQuery] ProductQueryRequest request,
            CancellationToken cancellationToken)
        {
            var (items, total) = await _productService.GetPageAsync(request, cancellationToken);
            return Ok(new PagedResponse<ProductResponse>
            {
                Items = items.Select(ToResponse).ToList(), Page = request.Page, PageSize = request.PageSize,
                TotalItems = total, TotalPages = (int)Math.Ceiling(total / (double)request.PageSize)
            });
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

        [HttpGet("facets")]
        public async Task<IActionResult> GetFacets(CancellationToken token)
        {
            return Ok(new
            {
                brands = await _db.Products.AsNoTracking().Select(item => item.Brand).Distinct().OrderBy(item => item).ToListAsync(token),
                maximumPrice = await _db.Products.AsNoTracking().Select(item => (decimal?)item.Price).MaxAsync(token) ?? 0
            });
        }

        [HttpPost]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<ProductResponse>> CreateProduct(
            CreateProductRequest request,
            CancellationToken cancellationToken)
        {
            var product = await _productService.CreateAsync(request, cancellationToken);
            var response = ToResponse(product);

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, response);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<ProductResponse>> UpdateProduct(
            int id,
            UpdateProductRequest request,
            CancellationToken cancellationToken)
        {
            var product = await _productService.UpdateAsync(id, request, cancellationToken);

            if (product is null)
            {
                return NotFound(new { message = $"Product with ID {id} was not found." });
            }

            return Ok(ToResponse(product));
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> DeleteProduct(
            int id,
            CancellationToken cancellationToken)
        {
            var wasDeleted = await _productService.DeleteAsync(id, cancellationToken);

            if (!wasDeleted)
            {
                return NotFound(new { message = $"Product with ID {id} was not found." });
            }

            var productDirectory = ProductDirectory(id);
            if (Directory.Exists(productDirectory)) Directory.Delete(productDirectory, true);

            return NoContent();
        }

        [HttpPost("{id:int}/images"), Authorize(Roles = UserRoles.Admin), RequestSizeLimit(25_000_000)]
        public async Task<ActionResult<ProductResponse>> UploadImages(
            int id, [FromForm] List<IFormFile> files, CancellationToken cancellationToken)
        {
            var product = await _db.Products.Include(item => item.Images).SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
            if (product is null) return NotFound(new { message = $"Product with ID {id} was not found." });
            if (files.Count == 0) return BadRequest(new { message = "Select at least one image." });
            if (product.Images.Count + files.Count > 8) return BadRequest(new { message = "A product can have up to 8 images." });

            var productDirectory = ProductDirectory(id);
            Directory.CreateDirectory(productDirectory);
            foreach (var file in files)
            {
                if (file.Length is <= 0 or > 5_000_000) return BadRequest(new { message = "Each image must be between 1 byte and 5 MB." });
                var extension = await DetectImageExtension(file, cancellationToken);
                if (extension is null) return BadRequest(new { message = "Only genuine JPEG, PNG and WebP images are allowed." });
                var fileName = $"{Guid.NewGuid():N}{extension}";
                await using var output = System.IO.File.Create(Path.Combine(productDirectory, fileName));
                await file.CopyToAsync(output, cancellationToken);
                product.Images.Add(new ProductImage
                {
                    Url = $"/uploads/products/{id}/{fileName}", AltText = product.Name,
                    SortOrder = product.Images.Count, IsPrimary = product.Images.Count == 0
                });
            }
            await _db.SaveChangesAsync(cancellationToken);
            return Ok(ToResponse((await _productService.GetByIdAsync(id, cancellationToken))!));
        }

        [HttpPost("{id:int}/images/{imageId:int}/primary"), Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> SetPrimaryImage(int id, int imageId, CancellationToken token)
        {
            var images = await _db.ProductImages.Where(item => item.ProductId == id).ToListAsync(token);
            if (images.All(item => item.Id != imageId)) return NotFound(new { message = "Product image was not found." });
            foreach (var image in images) image.IsPrimary = image.Id == imageId;
            await _db.SaveChangesAsync(token);
            return NoContent();
        }

        [HttpDelete("{id:int}/images/{imageId:int}"), Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> DeleteImage(int id, int imageId, CancellationToken token)
        {
            var image = await _db.ProductImages.SingleOrDefaultAsync(item => item.ProductId == id && item.Id == imageId, token);
            if (image is null) return NotFound(new { message = "Product image was not found." });
            var wasPrimary = image.IsPrimary;
            _db.ProductImages.Remove(image);
            await _db.SaveChangesAsync(token);
            DeleteStoredImage(image.Url);
            if (wasPrimary)
            {
                var next = await _db.ProductImages.Where(item => item.ProductId == id).OrderBy(item => item.SortOrder).FirstOrDefaultAsync(token);
                if (next is not null) { next.IsPrimary = true; await _db.SaveChangesAsync(token); }
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
                Sku = product.Sku,
                Brand = product.Brand,
                Price = product.Price,
                Stock = product.Stock,
                CategoryId = product.CategoryId,
                CategoryName = product.Category.Name,
                Images = product.Images.OrderByDescending(item => item.IsPrimary).ThenBy(item => item.SortOrder).Select(item => new ProductImageResponse { Id = item.Id, Url = item.Url, AltText = item.AltText, SortOrder = item.SortOrder, IsPrimary = item.IsPrimary }).ToList(),
                Variants = product.Variants.OrderBy(item => item.Id).Select(item => new ProductVariantResponse { Id = item.Id, Name = item.Name, Sku = item.Sku, Price = item.Price, Stock = item.Stock, IsActive = item.IsActive }).ToList(),
                Specifications = product.Specifications.OrderBy(item => item.SortOrder).Select(item => new ProductSpecificationResponse { Id = item.Id, Name = item.Name, Value = item.Value, SortOrder = item.SortOrder }).ToList()
            };
        }

        private string ProductDirectory(int id) => Path.Combine(
            _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads", "products", id.ToString());

        private void DeleteStoredImage(string relativeUrl)
        {
            var root = Path.GetFullPath(Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads", "products"));
            var path = Path.GetFullPath(Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), relativeUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar)));
            if (path.StartsWith(root, StringComparison.OrdinalIgnoreCase) && System.IO.File.Exists(path)) System.IO.File.Delete(path);
        }

        private static async Task<string?> DetectImageExtension(IFormFile file, CancellationToken token)
        {
            var header = new byte[12];
            await using var stream = file.OpenReadStream();
            var read = await stream.ReadAsync(header.AsMemory(0, header.Length), token);
            if (read >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF) return ".jpg";
            if (read >= 8 && header[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A })) return ".png";
            if (read >= 12 && System.Text.Encoding.ASCII.GetString(header, 0, 4) == "RIFF" && System.Text.Encoding.ASCII.GetString(header, 8, 4) == "WEBP") return ".webp";
            return null;
        }
    }
}
