namespace ShopEase.API.Options;

public class PasswordRecoveryOptions
{
    public const string SectionName = "PasswordRecovery";
    public int ExpiryMinutes { get; set; } = 30;
    public string ClientUrl { get; set; } = "http://localhost:5173";
    public string SmtpHost { get; set; } = "";
    public int SmtpPort { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string SmtpUsername { get; set; } = "";
    public string SmtpPassword { get; set; } = "";
    public string FromEmail { get; set; } = "";
}
