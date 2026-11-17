namespace ShopEase.API.DTOs;

public class AdminDashboardResponse
{
    public int CustomerCount { get; set; }
    public int ProductCount { get; set; }
    public int CategoryCount { get; set; }
    public int OrderCount { get; set; }
    public int PendingOrderCount { get; set; }
    public int LowStockProductCount { get; set; }
    public decimal GrossSales { get; set; }
    public List<AdminRecentOrderResponse> RecentOrders { get; set; } = [];
    public List<AdminLowStockProductResponse> LowStockProducts { get; set; } = [];
}

public class AdminRecentOrderResponse
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public DateTime PlacedAtUtc { get; set; }
    public string Status { get; set; } = "";
    public string PaymentStatus { get; set; } = "";
    public decimal Total { get; set; }
}

public class AdminLowStockProductResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string CategoryName { get; set; } = "";
    public int Stock { get; set; }
}
