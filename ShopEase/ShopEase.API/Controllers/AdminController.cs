using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopEase.API.Data;
using ShopEase.API.DTOs;
using ShopEase.API.Models;

namespace ShopEase.API.Controllers;

[ApiController, Authorize(Roles = UserRoles.Admin), Route("api/admin")]
public class AdminController : ControllerBase
{
    private const int LowStockThreshold = 5;
    private readonly ShopEaseDbContext _db;

    public AdminController(ShopEaseDbContext db) => _db = db;

    [HttpGet("dashboard")]
    public async Task<ActionResult<AdminDashboardResponse>> GetDashboard(CancellationToken token)
    {
        var response = new AdminDashboardResponse
        {
            CustomerCount = await _db.Users.CountAsync(user => user.Role == UserRoles.Customer, token),
            ProductCount = await _db.Products.CountAsync(token),
            CategoryCount = await _db.Categories.CountAsync(token),
            OrderCount = await _db.Orders.CountAsync(token),
            PendingOrderCount = await _db.Orders.CountAsync(order => order.Status == "Pending", token),
            LowStockProductCount = await _db.Products.CountAsync(product => product.Stock <= LowStockThreshold, token),
            GrossSales = await _db.Orders.Select(order => (decimal?)order.Total).SumAsync(token) ?? 0,
            RecentOrders = await _db.Orders
                .AsNoTracking()
                .OrderByDescending(order => order.PlacedAtUtc)
                .Take(6)
                .Select(order => new AdminRecentOrderResponse
                {
                    Id = order.Id,
                    OrderNumber = order.OrderNumber,
                    CustomerName = order.FullName,
                    PlacedAtUtc = order.PlacedAtUtc,
                    Status = order.Status,
                    PaymentStatus = order.PaymentStatus,
                    Total = order.Total
                })
                .ToListAsync(token),
            LowStockProducts = await _db.Products
                .AsNoTracking()
                .Where(product => product.Stock <= LowStockThreshold)
                .OrderBy(product => product.Stock)
                .ThenBy(product => product.Name)
                .Take(6)
                .Select(product => new AdminLowStockProductResponse
                {
                    Id = product.Id,
                    Name = product.Name,
                    CategoryName = product.Category.Name,
                    Stock = product.Stock
                })
                .ToListAsync(token)
        };

        return Ok(response);
    }
}
