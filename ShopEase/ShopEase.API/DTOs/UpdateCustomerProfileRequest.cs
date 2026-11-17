using System.ComponentModel.DataAnnotations;

namespace ShopEase.API.DTOs;

public class UpdateCustomerProfileRequest
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string FullName { get; set; } = "";

    [Required, EmailAddress, StringLength(254)]
    public string Email { get; set; } = "";

    [Required, Phone, StringLength(30)]
    public string Phone { get; set; } = "";
}
