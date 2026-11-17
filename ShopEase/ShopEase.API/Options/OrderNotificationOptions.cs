namespace ShopEase.API.Options;

public class OrderNotificationOptions
{
    public const string SectionName = "OrderNotifications";
    public string SmtpHost { get; set; } = "";
    public int SmtpPort { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string SmtpUsername { get; set; } = "";
    public string SmtpPassword { get; set; } = "";
    public string FromEmail { get; set; } = "";
}
