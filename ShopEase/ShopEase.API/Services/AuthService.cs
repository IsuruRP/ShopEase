using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
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

    public AuthService(
        ShopEaseDbContext dbContext,
        IPasswordHasher<User> passwordHasher,
        IOptions<JwtOptions> jwtOptions)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtOptions = jwtOptions.Value;
    }

    public async Task<AuthResponse?> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        var username = request.Username.Trim();
        var normalizedUsername = username.ToUpperInvariant();

        if (await _dbContext.Users.AnyAsync(
                user => user.NormalizedUsername == normalizedUsername,
                cancellationToken))
        {
            return null;
        }

        var isFirstUser = !await _dbContext.Users.AnyAsync(cancellationToken);
        var user = new User
        {
            Username = username,
            NormalizedUsername = normalizedUsername,
            Role = isFirstUser ? UserRoles.Admin : UserRoles.Customer
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreateAuthResponse(user);
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
}
