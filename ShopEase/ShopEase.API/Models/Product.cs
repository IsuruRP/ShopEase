namespace ShopEase.API.Models
{
    public class Product
    {
        public int Id { get; set; }

        public string Name { get; set; } = "";

        public string Description { get; set; } = "";

        public string Sku { get; set; } = "";

        public string Brand { get; set; } = "";

        public decimal Price { get; set; }

        public int Stock { get; set; }

        public int CategoryId { get; set; }

        public Category Category { get; set; } = null!;

        public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();

        public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();

        public ICollection<ProductSpecification> Specifications { get; set; } = new List<ProductSpecification>();
    }
}
