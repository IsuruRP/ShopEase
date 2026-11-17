namespace ShopEase.API.Models;

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public int ProductId { get; set; }
    public int? VariantId { get; set; }
    public string ProductName { get; set; } = "";
    public string VariantName { get; set; } = "";
    public string Sku { get; set; } = "";
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal { get; set; }
}
