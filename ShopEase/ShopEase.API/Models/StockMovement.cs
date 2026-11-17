namespace ShopEase.API.Models;

public class StockMovement
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
