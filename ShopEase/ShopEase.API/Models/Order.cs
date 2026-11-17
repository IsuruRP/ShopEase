namespace ShopEase.API.Models;

public class Order
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string OrderNumber { get; set; } = "";
    public DateTime PlacedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public string Status { get; set; } = "Pending";
    public string PaymentMethod { get; set; } = "CashOnDelivery";
    public string PaymentStatus { get; set; } = "Pending";
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Address { get; set; } = "";
    public string City { get; set; } = "";
    public string PostalCode { get; set; } = "";
    public string Notes { get; set; } = "";
    public string Carrier { get; set; } = "";
    public string TrackingNumber { get; set; } = "";
    public string CancellationReason { get; set; } = "";
    public DateTime? CancelledAtUtc { get; set; }
    public decimal Subtotal { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal Total { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<OrderTrackingEvent> TrackingEvents { get; set; } = new List<OrderTrackingEvent>();
}

public static class OrderStatuses
{
    public const string Pending = "Pending";
    public const string Confirmed = "Confirmed";
    public const string Processing = "Processing";
    public const string Packed = "Packed";
    public const string Shipped = "Shipped";
    public const string Delivered = "Delivered";
    public const string Cancelled = "Cancelled";

    public static readonly IReadOnlyDictionary<string, string[]> AllowedTransitions =
        new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            [Pending] = [Confirmed],
            [Confirmed] = [Processing],
            [Processing] = [Packed],
            [Packed] = [Shipped],
            [Shipped] = [Delivered],
            [Delivered] = [],
            [Cancelled] = []
        };

    public static string[] NextFor(string status) =>
        AllowedTransitions.TryGetValue(status, out var next) ? next : [];

    public static bool CanCancel(string status) =>
        status is Pending or Confirmed or Processing or Packed;
}
