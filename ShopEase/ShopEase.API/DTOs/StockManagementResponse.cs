using System.ComponentModel.DataAnnotations;

namespace ShopEase.API.DTOs;

public class StockManagementResponse
{
    public int TotalProducts { get; set; }
    public int TotalUnits { get; set; }
    public int LowStockCount { get; set; }
    public int OutOfStockCount { get; set; }
    public List<StockProductResponse> Products { get; set; } = [];
    public List<StockMovementResponse> RecentMovements { get; set; } = [];
}

public class StockProductResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string CategoryName { get; set; } = "";
    public int Stock { get; set; }
}

public class StockMovementResponse
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public int PreviousStock { get; set; }
    public int QuantityChange { get; set; }
    public int NewStock { get; set; }
    public string Reason { get; set; } = "";
    public string Note { get; set; } = "";
    public string PerformedBy { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; }
}

public class AdjustStockRequest
{
    [Range(1, int.MaxValue)] public int ProductId { get; set; }
    [Range(-1000000, 1000000)] public int QuantityChange { get; set; }
    [Required, StringLength(50)] public string Reason { get; set; } = "";
    [StringLength(300)] public string Note { get; set; } = "";
}
