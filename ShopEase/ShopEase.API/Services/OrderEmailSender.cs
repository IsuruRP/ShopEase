using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using ShopEase.API.Models;
using ShopEase.API.Options;

namespace ShopEase.API.Services;

public interface IOrderEmailSender
{
    Task SendConfirmationAsync(Order order, CancellationToken token = default);
}

public class OrderEmailSender : IOrderEmailSender
{
    private readonly OrderNotificationOptions _options;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<OrderEmailSender> _logger;
    public OrderEmailSender(IOptions<OrderNotificationOptions> options, IWebHostEnvironment environment, ILogger<OrderEmailSender> logger)
    { _options = options.Value; _environment = environment; _logger = logger; }

    public async Task SendConfirmationAsync(Order order, CancellationToken token = default)
    {
        if (string.IsNullOrWhiteSpace(_options.SmtpHost) || string.IsNullOrWhiteSpace(_options.FromEmail))
        {
            _logger.LogWarning("{Mode} order confirmation for {OrderNumber} to {Email} was not emailed because SMTP is not configured.", _environment.IsDevelopment() ? "Development" : "Production", order.OrderNumber, order.Email);
            return;
        }
        try
        {
            using var message = new MailMessage(_options.FromEmail, order.Email, $"ShopEase order {order.OrderNumber}",
                $"Hello {order.FullName},\n\nWe received your Cash on Delivery order {order.OrderNumber}.\nTotal: LKR {order.Total:N2}\nStatus: {order.Status}\n\nThank you for shopping with ShopEase.");
            using var client = new SmtpClient(_options.SmtpHost, _options.SmtpPort) { EnableSsl = _options.EnableSsl };
            if (!string.IsNullOrWhiteSpace(_options.SmtpUsername)) client.Credentials = new NetworkCredential(_options.SmtpUsername, _options.SmtpPassword);
            await client.SendMailAsync(message, token);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Order {OrderNumber} was created, but its confirmation email could not be sent.", order.OrderNumber);
        }
    }
}
