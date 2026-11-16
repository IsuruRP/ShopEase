namespace ShopEase.API.Models;

public class Order
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string OrderNumber { get; set; } = "";
    public DateTime PlacedAtUtc { get; set; }
    public string Status { get; set; } = "Pending";
    public string PaymentMethod { get; set; } = "CashOnDelivery";
    public string PaymentStatus { get; set; } = "Pending";
    public string FullName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Address { get; set; } = "";
    public string City { get; set; } = "";
    public string PostalCode { get; set; } = "";
    public string Notes { get; set; } = "";
    public decimal Subtotal { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal Total { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
