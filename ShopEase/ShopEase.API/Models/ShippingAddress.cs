namespace ShopEase.API.Models;

public class ShippingAddress
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Label { get; set; } = "Home";
    public string FullName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Address { get; set; } = "";
    public string City { get; set; } = "";
    public string PostalCode { get; set; } = "";
}
