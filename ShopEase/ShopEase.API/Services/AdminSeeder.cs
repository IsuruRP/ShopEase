using System.Net.Mail;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ShopEase.API.Data;
using ShopEase.API.Models;
using ShopEase.API.Options;

namespace ShopEase.API.Services;

public class AdminSeeder
{
    private readonly ShopEaseDbContext _db;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly AdminSeedOptions _options;
    private readonly ILogger<AdminSeeder> _logger;

    public AdminSeeder(
        ShopEaseDbContext db,
        IPasswordHasher<User> passwordHasher,
        IOptions<AdminSeedOptions> options,
        ILogger<AdminSeeder> logger)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _options = options.Value;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var supplied = new[] { _options.Username, _options.Password, _options.Email }
            .Count(value => !string.IsNullOrWhiteSpace(value));

        if (supplied == 0) return;
        if (supplied != 3)
        {
            throw new InvalidOperationException(
                "AdminSeed username, password and email must all be supplied through secrets or environment variables.");
        }

        if (_options.Username.Trim().Length < 3 || _options.Password.Length < 12)
        {
            throw new InvalidOperationException(
                "Admin seed username must be at least 3 characters and its password at least 12 characters.");
        }

        try { _ = new MailAddress(_options.Email.Trim()); }
        catch (FormatException)
        {
            throw new InvalidOperationException("AdminSeed email is not valid.");
        }

        if (await _db.Users.AnyAsync(user => user.Role == UserRoles.Admin, cancellationToken))
        {
            _logger.LogInformation("Admin seed skipped because an administrator already exists.");
            return;
        }

        var username = _options.Username.Trim();
        var normalizedUsername = username.ToUpperInvariant();
        var email = _options.Email.Trim().ToLowerInvariant();
        var normalizedEmail = email.ToUpperInvariant();

        if (await _db.Users.AnyAsync(
                user => user.NormalizedUsername == normalizedUsername || user.NormalizedEmail == normalizedEmail,
                cancellationToken))
        {
            throw new InvalidOperationException(
                "Admin seed username or email belongs to an existing account; the account was not elevated.");
        }

        var admin = new User
        {
            Username = username,
            NormalizedUsername = normalizedUsername,
            FullName = _options.FullName.Trim(),
            Email = email,
            NormalizedEmail = normalizedEmail,
            Role = UserRoles.Admin
        };
        admin.PasswordHash = _passwordHasher.HashPassword(admin, _options.Password);

        _db.Users.Add(admin);
        await _db.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Configured administrator account {Username} was created.", username);
    }
}
