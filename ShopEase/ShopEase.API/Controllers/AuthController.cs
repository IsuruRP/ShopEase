using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.API.DTOs;
using ShopEase.API.Services;

namespace ShopEase.API.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.RegisterAsync(request, cancellationToken);

        if (response is null)
        {
            return Conflict(new { message = "This username is already registered." });
        }

        return Ok(response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.LoginAsync(request, cancellationToken);

        if (response is null)
        {
            return Unauthorized(new { message = "Invalid username or password." });
        }

        return Ok(response);
    }
}
