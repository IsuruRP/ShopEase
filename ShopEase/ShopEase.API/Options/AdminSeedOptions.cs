namespace ShopEase.API.Options;

public class AdminSeedOptions
{
    public const string SectionName = "AdminSeed";
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string Email { get; set; } = "";
    public string FullName { get; set; } = "Store Administrator";
}
