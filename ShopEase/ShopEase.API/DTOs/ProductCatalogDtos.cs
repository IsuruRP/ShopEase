using System.ComponentModel.DataAnnotations;

namespace ShopEase.API.DTOs;

public class ProductResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Sku { get; set; } = "";
    public string Brand { get; set; } = "";
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = "";
    public List<ProductImageResponse> Images { get; set; } = [];
    public List<ProductVariantResponse> Variants { get; set; } = [];
    public List<ProductSpecificationResponse> Specifications { get; set; } = [];
}

public class ProductImageResponse
{
    public int Id { get; set; }
    public string Url { get; set; } = "";
    public string AltText { get; set; } = "";
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }
}

public class ProductVariantResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Sku { get; set; } = "";
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; }
}

public class ProductSpecificationResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Value { get; set; } = "";
    public int SortOrder { get; set; }
}

public class ProductQueryRequest
{
    [Range(1, int.MaxValue)] public int Page { get; set; } = 1;
    [Range(1, 100)] public int PageSize { get; set; } = 12;
    [StringLength(100)] public string? Search { get; set; }
    public int? CategoryId { get; set; }
    [StringLength(100)] public string? Brand { get; set; }
    public bool InStockOnly { get; set; }
    [Range(typeof(decimal), "0", "1000000000")] public decimal? MinPrice { get; set; }
    [Range(typeof(decimal), "0", "1000000000")] public decimal? MaxPrice { get; set; }
    [StringLength(30)] public string Sort { get; set; } = "featured";
}

public class PagedResponse<T>
{
    public List<T> Items { get; set; } = [];
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}
