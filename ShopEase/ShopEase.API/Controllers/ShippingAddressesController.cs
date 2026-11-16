using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopEase.API.Data;
using ShopEase.API.DTOs;
using ShopEase.API.Models;

namespace ShopEase.API.Controllers;

[ApiController, Authorize, Route("api/shipping-addresses")]
public class ShippingAddressesController : ControllerBase
{
    private readonly ShopEaseDbContext _db;
    public ShippingAddressesController(ShopEaseDbContext db) => _db = db;
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShippingAddress>>> Get(CancellationToken token) => Ok(await _db.ShippingAddresses.AsNoTracking().Where(item => item.UserId == UserId).OrderBy(item => item.Id).ToListAsync(token));

    [HttpPost]
    public async Task<ActionResult<ShippingAddress>> Create(ShippingAddressRequest request, CancellationToken token)
    {
        var address = new ShippingAddress { UserId = UserId, Label = request.Label.Trim(), FullName = request.FullName.Trim(), Phone = request.Phone.Trim(), Address = request.Address.Trim(), City = request.City.Trim(), PostalCode = request.PostalCode.Trim() };
        _db.ShippingAddresses.Add(address); await _db.SaveChangesAsync(token);
        return Created($"/api/shipping-addresses/{address.Id}", address);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken token)
    {
        var address = await _db.ShippingAddresses.SingleOrDefaultAsync(item => item.Id == id && item.UserId == UserId, token);
        if (address is null) return NotFound();
        _db.ShippingAddresses.Remove(address); await _db.SaveChangesAsync(token); return NoContent();
    }
}
