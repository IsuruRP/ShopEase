using System.ComponentModel.DataAnnotations;

namespace ShopEase.API.DTOs;

public class AdminOrderListResponse
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public DateTime PlacedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public string Status { get; set; } = "";
    public string PaymentStatus { get; set; } = "";
    public decimal Total { get; set; }
    public int ItemCount { get; set; }
    public string TrackingNumber { get; set; } = "";
}

public class AdminOrderDetailsResponse : OrderResponse
{
    public int? UserId { get; set; }
    public bool CanCancel { get; set; }
    public string[] AllowedNextStatuses { get; set; } = [];
}

public class UpdateOrderStatusRequest
{
    [Required, StringLength(30)] public string Status { get; set; } = "";
    [StringLength(500)] public string Note { get; set; } = "";
    [StringLength(100)] public string Carrier { get; set; } = "";
    [StringLength(100)] public string TrackingNumber { get; set; } = "";
}

public class CancelOrderRequest
{
    [Required, StringLength(500, MinimumLength = 3)]
    public string Reason { get; set; } = "";
}
