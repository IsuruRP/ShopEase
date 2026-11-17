using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopEase.API.Data;
using ShopEase.API.DTOs;
using ShopEase.API.Models;

namespace ShopEase.API.Controllers;

[ApiController, Authorize, Route("api/profile")]
public class ProfileController : ControllerBase
{
    private readonly ShopEaseDbContext _db;

    public ProfileController(ShopEaseDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<CustomerProfileResponse>> Get(CancellationToken token)
    {
        var userId = GetUserId();
        var user = await _db.Users.AsNoTracking().SingleOrDefaultAsync(item => item.Id == userId, token);
        if (user is null) return NotFound(new { message = "Customer profile was not found." });

        return Ok(await ToResponse(user, token));
    }

    [HttpPut]
    public async Task<ActionResult<CustomerProfileResponse>> Update(
        UpdateCustomerProfileRequest request,
        CancellationToken token)
    {
        var user = await _db.Users.SingleOrDefaultAsync(item => item.Id == GetUserId(), token);
        if (user is null) return NotFound(new { message = "Customer profile was not found." });

        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        if (await _db.Users.AnyAsync(
                item => item.Id != user.Id && item.NormalizedEmail == normalizedEmail,
                token))
        {
            return Conflict(new { message = "This email is already registered." });
        }

        user.FullName = request.FullName.Trim();
        user.Email = request.Email.Trim().ToLowerInvariant();
        user.NormalizedEmail = normalizedEmail;
        user.Phone = request.Phone.Trim();
        await _db.SaveChangesAsync(token);

        return Ok(await ToResponse(user, token));
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<CustomerProfileResponse> ToResponse(User user, CancellationToken token) => new()
    {
        Id = user.Id,
        Username = user.Username,
        Role = user.Role,
        FullName = user.FullName,
        Email = user.Email,
        Phone = user.Phone,
        OrderCount = await _db.Orders.CountAsync(item => item.UserId == user.Id, token),
        AddressCount = await _db.ShippingAddresses.CountAsync(item => item.UserId == user.Id, token)
    };
}
