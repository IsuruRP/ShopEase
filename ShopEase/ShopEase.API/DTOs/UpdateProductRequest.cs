using System.ComponentModel.DataAnnotations;

namespace ShopEase.API.DTOs
{
    public class UpdateProductRequest
    {
        [Required]
        [StringLength(200, MinimumLength = 2)]
        public string Name { get; set; } = "";

        [StringLength(1000)]
        public string Description { get; set; } = "";

        [Required, StringLength(80, MinimumLength = 2)]
        public string Sku { get; set; } = "";

        [Required, StringLength(100, MinimumLength = 2)]
        public string Brand { get; set; } = "";

        [Range(typeof(decimal), "0.01", "1000000000")]
        public decimal Price { get; set; }

        [Range(0, 1000000)]
        public int Stock { get; set; }

        [Range(1, int.MaxValue)]
        public int CategoryId { get; set; }

        public List<ProductVariantRequest> Variants { get; set; } = [];

        public List<ProductSpecificationRequest> Specifications { get; set; } = [];
    }
}
