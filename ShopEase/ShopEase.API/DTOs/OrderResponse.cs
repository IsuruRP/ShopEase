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
    public string FullName { get; set; } = "";
    public string Address { get; set; } = "";
    public string City { get; set; } = "";
    public List<OrderItemResponse> Items { get; set; } = [];
}

public class OrderItemResponse
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal { get; set; }
}
