using System.ComponentModel.DataAnnotations;

namespace ShopEase.API.DTOs;

public class CreateOrderRequest
{
    [Required, StringLength(100)] public string FullName { get; set; } = "";
    [Required, EmailAddress, StringLength(254)] public string Email { get; set; } = "";
    [Required, Phone, StringLength(30)] public string Phone { get; set; } = "";
    [Required, StringLength(300)] public string Address { get; set; } = "";
    [Required, StringLength(100)] public string City { get; set; } = "";
    [Required, StringLength(20)] public string PostalCode { get; set; } = "";
    [StringLength(500)] public string Notes { get; set; } = "";
    [Required, MinLength(1)] public List<CreateOrderItemRequest> Items { get; set; } = [];
}

public class CreateOrderItemRequest
{
    [Range(1, int.MaxValue)] public int ProductId { get; set; }
    public int? VariantId { get; set; }
    [Range(1, 100)] public int Quantity { get; set; }
}
