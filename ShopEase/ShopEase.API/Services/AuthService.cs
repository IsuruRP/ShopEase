using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using ShopEase.API.Data;
using ShopEase.API.DTOs;
using ShopEase.API.Models;
using ShopEase.API.Options;

namespace ShopEase.API.Services;

public class AuthService : IAuthService
{
    private readonly ShopEaseDbContext _dbContext;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly JwtOptions _jwtOptions;
    private readonly PasswordRecoveryOptions _passwordRecoveryOptions;
    private readonly IPasswordResetEmailSender _emailSender;

    public AuthService(
        ShopEaseDbContext dbContext,
        IPasswordHasher<User> passwordHasher,
        IOptions<JwtOptions> jwtOptions,
        IOptions<PasswordRecoveryOptions> passwordRecoveryOptions,
        IPasswordResetEmailSender emailSender)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtOptions = jwtOptions.Value;
        _passwordRecoveryOptions = passwordRecoveryOptions.Value;
        _emailSender = emailSender;
    }

    public async Task<AuthResponse?> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        var username = request.Username.Trim();
        var normalizedUsername = username.ToUpperInvariant();
        var email = request.Email.Trim().ToLowerInvariant();
        var normalizedEmail = email.ToUpperInvariant();

        if (await _dbContext.Users.AnyAsync(
                user => user.NormalizedUsername == normalizedUsername ||
                        user.NormalizedEmail == normalizedEmail,
                cancellationToken))
        {
            return null;
        }

        var user = new User
        {
            Username = username,
            NormalizedUsername = normalizedUsername,
            FullName = request.FullName.Trim(),
            Email = email,
            NormalizedEmail = normalizedEmail,
            Role = UserRoles.Customer
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreateAuthResponse(user);
    }

    public async Task RequestPasswordResetAsync(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var user = await _dbContext.Users.SingleOrDefaultAsync(
            item => item.NormalizedEmail == normalizedEmail,
            cancellationToken);

        // Always make the endpoint appear successful so account existence is not disclosed.
        if (user is null) return;

        var rawToken = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        var now = DateTime.UtcNow;
        var token = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = HashToken(rawToken),
            CreatedAtUtc = now,
            ExpiresAtUtc = now.AddMinutes(_passwordRecoveryOptions.ExpiryMinutes)
        };

        _dbContext.PasswordResetTokens.Add(token);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _emailSender.SendAsync(user, rawToken, cancellationToken);
    }

    public async Task<bool> ResetPasswordAsync(
        ResetPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        var tokenHash = HashToken(request.Token);
        var resetToken = await _dbContext.PasswordResetTokens
            .Include(item => item.User)
            .SingleOrDefaultAsync(item => item.TokenHash == tokenHash, cancellationToken);

        var now = DateTime.UtcNow;
        if (resetToken is null || resetToken.UsedAtUtc is not null || resetToken.ExpiresAtUtc <= now)
        {
            return false;
        }

        resetToken.User.PasswordHash = _passwordHasher.HashPassword(
            resetToken.User,
            request.Password);
        resetToken.User.TokenVersion++;

        var activeTokens = await _dbContext.PasswordResetTokens
            .Where(item => item.UserId == resetToken.UserId && item.UsedAtUtc == null)
            .ToListAsync(cancellationToken);
        foreach (var activeToken in activeTokens) activeToken.UsedAtUtc = now;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<AuthResponse?> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var normalizedUsername = request.Username.Trim().ToUpperInvariant();
        var user = await _dbContext.Users.SingleOrDefaultAsync(
            user => user.NormalizedUsername == normalizedUsername,
            cancellationToken);

        if (user is null)
        {
            return null;
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            request.Password);

        if (verificationResult == PasswordVerificationResult.Failed)
        {
            return null;
        }

        if (verificationResult == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return CreateAuthResponse(user);
    }

    private AuthResponse CreateAuthResponse(User user)
    {
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(_jwtOptions.ExpiryMinutes);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("token_version", user.TokenVersion.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var signingKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_jwtOptions.Key));
        var credentials = new SigningCredentials(
            signingKey,
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        return new AuthResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAtUtc = expiresAtUtc,
            Username = user.Username,
            Role = user.Role
        };
    }

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
