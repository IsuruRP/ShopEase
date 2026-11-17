using System.Security.Claims;
using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopEase.API.Data;
using ShopEase.API.DTOs;
using ShopEase.API.Models;
using ShopEase.API.Services;

namespace ShopEase.API.Controllers;

[ApiController, Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly ShopEaseDbContext _db;
    private readonly IOrderEmailSender _emailSender;
    public OrdersController(ShopEaseDbContext db, IOrderEmailSender emailSender) { _db = db; _emailSender = emailSender; }

    [HttpPost, AllowAnonymous, EnableRateLimiting("checkout")]
    public async Task<ActionResult<OrderResponse>> Create(CreateOrderRequest request, CancellationToken token)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable, token);
        int? userId = int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var authenticatedUserId) ? authenticatedUserId : null;
        var requested = request.Items.GroupBy(item => new { item.ProductId, item.VariantId })
            .Select(group => new { group.Key.ProductId, group.Key.VariantId, Quantity = group.Sum(item => item.Quantity) }).ToList();
        var productIds = requested.Select(item => item.ProductId).Distinct().ToList();
        var products = await _db.Products.Include(product => product.Variants).Where(product => productIds.Contains(product.Id)).ToListAsync(token);
        if (products.Count != productIds.Count) return BadRequest(new { message = "One or more products no longer exist." });

        var order = new Order
        {
            UserId = userId, OrderNumber = $"SE-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}", PlacedAtUtc = DateTime.UtcNow, UpdatedAtUtc = DateTime.UtcNow,
            FullName = request.FullName.Trim(), Email = request.Email.Trim().ToLowerInvariant(), Phone = request.Phone.Trim(), Address = request.Address.Trim(), City = request.City.Trim(), PostalCode = request.PostalCode.Trim(), Notes = request.Notes.Trim()
        };
        foreach (var line in requested)
        {
            var product = products.Single(item => item.Id == line.ProductId);
            var activeVariants = product.Variants.Where(item => item.IsActive).ToList();
            ProductVariant? variant = null;
            if (activeVariants.Count > 0)
            {
                variant = activeVariants.SingleOrDefault(item => item.Id == line.VariantId);
                if (variant is null) return BadRequest(new { message = $"Select an available variant for {product.Name}." });
                if (line.Quantity > variant.Stock) return Conflict(new { message = $"Only {variant.Stock} units of {product.Name} - {variant.Name} are available." });
            }
            else if (line.VariantId.HasValue) return BadRequest(new { message = $"{product.Name} does not have selectable variants." });
            else if (line.Quantity > product.Stock) return Conflict(new { message = $"Only {product.Stock} units of {product.Name} are available." });

            var previousStock = product.Stock;
            product.Stock -= line.Quantity;
            if (variant is not null) variant.Stock -= line.Quantity;
            var unitPrice = variant?.Price ?? product.Price;
            order.Items.Add(new OrderItem { ProductId = product.Id, VariantId = variant?.Id, ProductName = product.Name, VariantName = variant?.Name ?? "", Sku = variant?.Sku ?? product.Sku, UnitPrice = unitPrice, Quantity = line.Quantity, LineTotal = unitPrice * line.Quantity });
            _db.StockMovements.Add(new StockMovement { ProductId = product.Id, ProductName = product.Name, PreviousStock = previousStock, QuantityChange = -line.Quantity, NewStock = product.Stock, Reason = "Order", Note = $"{order.OrderNumber} · {variant?.Sku ?? product.Sku}", PerformedBy = "System", CreatedAtUtc = DateTime.UtcNow });
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
        await transaction.CommitAsync(token);
        await _emailSender.SendConfirmationAsync(order, token);
        return CreatedAtAction(nameof(GetMine), new { }, ToResponse(order));
    }

    [HttpGet("mine"), Authorize]
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
        Total = order.Total, FullName = order.FullName, Email = order.Email, Phone = order.Phone, Address = order.Address,
        City = order.City, PostalCode = order.PostalCode, Notes = order.Notes, Carrier = order.Carrier,
        TrackingNumber = order.TrackingNumber, CancellationReason = order.CancellationReason,
        CancelledAtUtc = order.CancelledAtUtc,
        Items = order.Items.Select(item => new OrderItemResponse { ProductId = item.ProductId, VariantId = item.VariantId, ProductName = item.ProductName, VariantName = item.VariantName, Sku = item.Sku, UnitPrice = item.UnitPrice, Quantity = item.Quantity, LineTotal = item.LineTotal }).ToList(),
        TrackingEvents = order.TrackingEvents.OrderByDescending(item => item.CreatedAtUtc).Select(item => new OrderTrackingEventResponse
        {
            Id = item.Id, Status = item.Status, Message = item.Message,
            CreatedBy = item.CreatedBy, CreatedAtUtc = item.CreatedAtUtc
        }).ToList()
    };
}
