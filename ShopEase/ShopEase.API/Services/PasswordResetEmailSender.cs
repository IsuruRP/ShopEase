using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using ShopEase.API.Models;
using ShopEase.API.Options;

namespace ShopEase.API.Services;

public class PasswordResetEmailSender : IPasswordResetEmailSender
{
    private readonly PasswordRecoveryOptions _options;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<PasswordResetEmailSender> _logger;

    public PasswordResetEmailSender(
        IOptions<PasswordRecoveryOptions> options,
        IWebHostEnvironment environment,
        ILogger<PasswordResetEmailSender> logger)
    {
        _options = options.Value;
        _environment = environment;
        _logger = logger;
    }

    public async Task SendAsync(
        User user,
        string resetToken,
        CancellationToken cancellationToken = default)
    {
        var resetUrl = $"{_options.ClientUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(resetToken)}";

        if (string.IsNullOrWhiteSpace(_options.SmtpHost) ||
            string.IsNullOrWhiteSpace(_options.FromEmail))
        {
            if (_environment.IsDevelopment())
            {
                _logger.LogWarning(
                    "Development password reset for {Username}: {ResetUrl}",
                    user.Username,
                    resetUrl);
                return;
            }

            throw new InvalidOperationException("Password recovery email is not configured.");
        }

        using var message = new MailMessage(
            _options.FromEmail,
            user.Email,
            "Reset your ShopEase password",
            $"Hello {user.FullName},\n\nUse this link to reset your ShopEase password:\n{resetUrl}\n\nThis link expires in {_options.ExpiryMinutes} minutes. If you did not request it, you can ignore this email.");

        using var smtpClient = new SmtpClient(_options.SmtpHost, _options.SmtpPort)
        {
            EnableSsl = _options.EnableSsl
        };

        if (!string.IsNullOrWhiteSpace(_options.SmtpUsername))
        {
            smtpClient.Credentials = new NetworkCredential(
                _options.SmtpUsername,
                _options.SmtpPassword);
        }

        cancellationToken.ThrowIfCancellationRequested();
        await smtpClient.SendMailAsync(message, cancellationToken);
    }
}
