namespace ShopEase.API.Models;

public class OrderTrackingEvent
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string Status { get; set; } = "";
    public string Message { get; set; } = "";
    public string CreatedBy { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; }
    public Order Order { get; set; } = null!;
}
