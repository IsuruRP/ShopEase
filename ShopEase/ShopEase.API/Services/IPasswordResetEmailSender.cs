using ShopEase.API.Models;

namespace ShopEase.API.Services;

public interface IPasswordResetEmailSender
{
    Task SendAsync(User user, string resetToken, CancellationToken cancellationToken = default);
}
