namespace ShopEase.API.DTOs;

public class OrderResponse
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = "";
    public DateTime PlacedAtUtc { get; set; }
    public string Status { get; set; } = "";
    public string PaymentMethod { get; set; } = "";
    public string PaymentStatus { get; set; } = "";
    public decimal Subtotal { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal Total { get; set; }
}
