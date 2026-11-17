using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ShopEase.API.DTOs;
using ShopEase.API.Options;
using ShopEase.API.Services;

namespace ShopEase.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _environment;

    public AuthController(IAuthService authService, IWebHostEnvironment environment)
    {
        _authService = authService;
        _environment = environment;
    }

    [HttpPost("register"), AllowAnonymous, EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.RegisterAsync(request, cancellationToken);

        if (response is null)
        {
            return Conflict(new { message = "This username or email is already registered." });
        }

        WriteAuthCookie(response);
        return Ok(response);
    }

    [HttpPost("login"), AllowAnonymous, EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.LoginAsync(request, cancellationToken);

        if (response is null)
        {
            return Unauthorized(new { message = "Invalid username or password." });
        }

        WriteAuthCookie(response);
        return Ok(response);
    }

    [HttpGet("session"), Authorize]
    public ActionResult<AuthResponse> Session()
    {
        var expiryClaim = User.FindFirstValue("exp");
        var expiresAtUtc = long.TryParse(expiryClaim, out var unixSeconds)
            ? DateTimeOffset.FromUnixTimeSeconds(unixSeconds).UtcDateTime
            : DateTime.UtcNow;

        return Ok(new AuthResponse
        {
            Username = User.Identity?.Name ?? "",
            Role = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role") ?? "",
            ExpiresAtUtc = expiresAtUtc
        });
    }

    [HttpPost("logout"), AllowAnonymous]
    public IActionResult Logout()
    {
        DeleteAuthCookie();
        return NoContent();
    }

    [HttpPost("forgot-password"), AllowAnonymous, EnableRateLimiting("auth")]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await _authService.RequestPasswordResetAsync(request, cancellationToken);
        return Ok(new
        {
            message = "If an account exists for that email, password reset instructions have been sent."
        });
    }

    [HttpPost("reset-password"), AllowAnonymous, EnableRateLimiting("auth")]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        if (!await _authService.ResetPasswordAsync(request, cancellationToken))
        {
            return BadRequest(new { message = "This reset link is invalid or has expired." });
        }

        DeleteAuthCookie();
        return Ok(new { message = "Your password has been reset. You can now sign in." });
    }

    private void WriteAuthCookie(AuthResponse response)
    {
        Response.Cookies.Append(AuthCookieDefaults.Name, response.Token, CookieOptions(response.ExpiresAtUtc));
    }

    private void DeleteAuthCookie()
    {
        Response.Cookies.Delete(AuthCookieDefaults.Name, CookieOptions(DateTime.UtcNow.AddDays(-1)));
    }

    private CookieOptions CookieOptions(DateTime expiresAtUtc) => new()
    {
        HttpOnly = true,
        Secure = !_environment.IsDevelopment(),
        SameSite = SameSiteMode.Strict,
        Path = "/api",
        Expires = new DateTimeOffset(expiresAtUtc)
    };
}
