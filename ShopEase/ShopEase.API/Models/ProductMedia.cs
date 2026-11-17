namespace ShopEase.API.Models;

public class ProductImage
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string Url { get; set; } = "";
    public string AltText { get; set; } = "";
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }
}

public class ProductVariant
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string Name { get; set; } = "";
    public string Sku { get; set; } = "";
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ProductSpecification
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string Name { get; set; } = "";
    public string Value { get; set; } = "";
    public int SortOrder { get; set; }
}
