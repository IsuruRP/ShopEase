using System.ComponentModel.DataAnnotations;

namespace ShopEase.API.DTOs;

public class ShippingAddressRequest
{
    [Required, StringLength(30)] public string Label { get; set; } = "Home";
    [Required, StringLength(100)] public string FullName { get; set; } = "";
    [Required, Phone, StringLength(30)] public string Phone { get; set; } = "";
    [Required, StringLength(300)] public string Address { get; set; } = "";
    [Required, StringLength(100)] public string City { get; set; } = "";
    [Required, StringLength(20)] public string PostalCode { get; set; } = "";
}
