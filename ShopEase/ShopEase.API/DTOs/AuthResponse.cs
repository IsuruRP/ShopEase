namespace ShopEase.API.DTOs;

public class AuthResponse
{
    public string Token { get; set; } = "";

    public DateTime ExpiresAtUtc { get; set; }

    public string Username { get; set; } = "";

    public string Role { get; set; } = "";
}
