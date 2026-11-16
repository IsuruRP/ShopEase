namespace ShopEase.API.Models;

public class User
{
    public int Id { get; set; }

    public string Username { get; set; } = "";

    public string NormalizedUsername { get; set; } = "";

    public string PasswordHash { get; set; } = "";

    public string Role { get; set; } = UserRoles.Customer;
}
