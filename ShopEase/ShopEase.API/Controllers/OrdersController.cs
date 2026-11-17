using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopEase.API.Data;
using ShopEase.API.DTOs;
using ShopEase.API.Models;

namespace ShopEase.API.Controllers;

[ApiController, Authorize, Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly ShopEaseDbContext _db;
    public OrdersController(ShopEaseDbContext db) => _db = db;

    [HttpPost]
    public async Task<ActionResult<OrderResponse>> Create(CreateOrderRequest request, CancellationToken token)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var requested = request.Items.GroupBy(item => item.ProductId).ToDictionary(group => group.Key, group => group.Sum(item => item.Quantity));
        var products = await _db.Products.Where(product => requested.Keys.Contains(product.Id)).ToListAsync(token);
        if (products.Count != requested.Count) return BadRequest(new { message = "One or more products no longer exist." });
        foreach (var product in products) if (requested[product.Id] > product.Stock) return Conflict(new { message = $"Only {product.Stock} units of {product.Name} are available." });

        var order = new Order
        {
            UserId = userId, OrderNumber = $"SE-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}", PlacedAtUtc = DateTime.UtcNow, UpdatedAtUtc = DateTime.UtcNow,
            FullName = request.FullName.Trim(), Phone = request.Phone.Trim(), Address = request.Address.Trim(), City = request.City.Trim(), PostalCode = request.PostalCode.Trim(), Notes = request.Notes.Trim()
        };
        foreach (var product in products)
        {
            var quantity = requested[product.Id];
            var previousStock = product.Stock;
            product.Stock -= quantity;
            order.Items.Add(new OrderItem { ProductId = product.Id, ProductName = product.Name, UnitPrice = product.Price, Quantity = quantity, LineTotal = product.Price * quantity });
            _db.StockMovements.Add(new StockMovement { ProductId = product.Id, ProductName = product.Name, PreviousStock = previousStock, QuantityChange = -quantity, NewStock = product.Stock, Reason = "Order", Note = order.OrderNumber, PerformedBy = "System", CreatedAtUtc = DateTime.UtcNow });
        }
        order.Subtotal = order.Items.Sum(item => item.LineTotal);
        order.DeliveryFee = order.Subtotal >= 100000m ? 0m : 750m;
        order.Total = order.Subtotal + order.DeliveryFee;
        order.TrackingEvents.Add(new OrderTrackingEvent
        {
            Status = OrderStatuses.Pending,
            Message = "Order received and awaiting confirmation.",
            CreatedBy = "System",
            CreatedAtUtc = order.PlacedAtUtc
        });
        _db.Orders.Add(order);
        await _db.SaveChangesAsync(token);
        return CreatedAtAction(nameof(GetMine), new { }, ToResponse(order));
    }

    [HttpGet("mine")]
    public async Task<ActionResult<IEnumerable<OrderResponse>>> GetMine(CancellationToken token)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok((await _db.Orders.AsNoTracking()
            .Include(order => order.Items)
            .Include(order => order.TrackingEvents)
            .Where(order => order.UserId == userId)
            .OrderByDescending(order => order.PlacedAtUtc)
            .ToListAsync(token)).Select(ToResponse));
    }

    private static OrderResponse ToResponse(Order order) => new()
    {
        Id = order.Id, OrderNumber = order.OrderNumber, PlacedAtUtc = order.PlacedAtUtc,
        UpdatedAtUtc = order.UpdatedAtUtc, Status = order.Status, PaymentMethod = order.PaymentMethod,
        PaymentStatus = order.PaymentStatus, Subtotal = order.Subtotal, DeliveryFee = order.DeliveryFee,
        Total = order.Total, FullName = order.FullName, Phone = order.Phone, Address = order.Address,
        City = order.City, PostalCode = order.PostalCode, Notes = order.Notes, Carrier = order.Carrier,
        TrackingNumber = order.TrackingNumber, CancellationReason = order.CancellationReason,
        CancelledAtUtc = order.CancelledAtUtc,
        Items = order.Items.Select(item => new OrderItemResponse { ProductId = item.ProductId, ProductName = item.ProductName, UnitPrice = item.UnitPrice, Quantity = item.Quantity, LineTotal = item.LineTotal }).ToList(),
        TrackingEvents = order.TrackingEvents.OrderByDescending(item => item.CreatedAtUtc).Select(item => new OrderTrackingEventResponse
        {
            Id = item.Id, Status = item.Status, Message = item.Message,
            CreatedBy = item.CreatedBy, CreatedAtUtc = item.CreatedAtUtc
        }).ToList()
    };
}
