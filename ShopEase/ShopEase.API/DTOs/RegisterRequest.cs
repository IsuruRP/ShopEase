using System.ComponentModel.DataAnnotations;

namespace ShopEase.API.DTOs;

public class RegisterRequest
{
    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string Username { get; set; } = "";

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = "";
}
