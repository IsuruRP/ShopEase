namespace ShopEase.API.Models;

public class User
{
    public int Id { get; set; }

    public string Username { get; set; } = "";

    public string NormalizedUsername { get; set; } = "";

    public string PasswordHash { get; set; } = "";

    public string Role { get; set; } = UserRoles.Customer;

    public string FullName { get; set; } = "";

    public string Email { get; set; } = "";

    public string? NormalizedEmail { get; set; }

    public string Phone { get; set; } = "";

    public int TokenVersion { get; set; }
}
