using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
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
            PendingOrderCount = await _db.Orders.CountAsync(
                order => order.Status != OrderStatuses.Delivered && order.Status != OrderStatuses.Cancelled,
                token),
            LowStockProductCount = await _db.Products.CountAsync(product => product.Stock <= LowStockThreshold, token),
            GrossSales = await _db.Orders
                .Where(order => order.Status != OrderStatuses.Cancelled)
                .Select(order => (decimal?)order.Total)
                .SumAsync(token) ?? 0,
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

    [HttpGet("orders")]
    public async Task<ActionResult<IEnumerable<AdminOrderListResponse>>> GetOrders(
        [FromQuery] string? search,
        [FromQuery] string? status,
        CancellationToken token)
    {
        var query = _db.Orders.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(order => order.OrderNumber.Contains(term) ||
                                         order.FullName.Contains(term) ||
                                         order.Phone.Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(order => order.Status == status);
        }

        return Ok(await query.OrderByDescending(order => order.PlacedAtUtc)
            .Select(order => new AdminOrderListResponse
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                CustomerName = order.FullName,
                PlacedAtUtc = order.PlacedAtUtc,
                UpdatedAtUtc = order.UpdatedAtUtc,
                Status = order.Status,
                PaymentStatus = order.PaymentStatus,
                Total = order.Total,
                ItemCount = order.Items.Sum(item => item.Quantity),
                TrackingNumber = order.TrackingNumber
            })
            .ToListAsync(token));
    }

    [HttpGet("orders/{id:int}")]
    public async Task<ActionResult<AdminOrderDetailsResponse>> GetOrder(int id, CancellationToken token)
    {
        var order = await LoadOrder(id, token);
        return order is null
            ? NotFound(new { message = $"Order with ID {id} was not found." })
            : Ok(ToAdminOrderResponse(order));
    }

    [HttpPut("orders/{id:int}/status")]
    public async Task<ActionResult<AdminOrderDetailsResponse>> UpdateOrderStatus(
        int id,
        UpdateOrderStatusRequest request,
        CancellationToken token)
    {
        var order = await LoadOrder(id, token);
        if (order is null) return NotFound(new { message = $"Order with ID {id} was not found." });

        var nextStatus = OrderStatuses.NextFor(order.Status)
            .SingleOrDefault(item => item.Equals(request.Status.Trim(), StringComparison.OrdinalIgnoreCase));
        if (nextStatus is null)
        {
            return Conflict(new { message = $"Order cannot move from {order.Status} to {request.Status}." });
        }

        if (nextStatus == OrderStatuses.Shipped &&
            (string.IsNullOrWhiteSpace(request.Carrier) || string.IsNullOrWhiteSpace(request.TrackingNumber)))
        {
            return BadRequest(new { message = "Carrier and tracking number are required before shipping." });
        }

        var now = DateTime.UtcNow;
        order.Status = nextStatus;
        order.UpdatedAtUtc = now;
        if (nextStatus == OrderStatuses.Shipped)
        {
            order.Carrier = request.Carrier.Trim();
            order.TrackingNumber = request.TrackingNumber.Trim();
        }
        if (nextStatus == OrderStatuses.Delivered) order.PaymentStatus = "Collected";

        order.TrackingEvents.Add(new OrderTrackingEvent
        {
            Status = nextStatus,
            Message = string.IsNullOrWhiteSpace(request.Note) ? DefaultStatusMessage(nextStatus) : request.Note.Trim(),
            CreatedBy = User.Identity?.Name ?? "Administrator",
            CreatedAtUtc = now
        });
        await _db.SaveChangesAsync(token);
        return Ok(ToAdminOrderResponse(order));
    }

    [HttpPost("orders/{id:int}/cancel")]
    public async Task<ActionResult<AdminOrderDetailsResponse>> CancelOrder(
        int id,
        CancelOrderRequest request,
        CancellationToken token)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(token);
        var order = await LoadOrder(id, token);
        if (order is null) return NotFound(new { message = $"Order with ID {id} was not found." });
        if (!OrderStatuses.CanCancel(order.Status))
        {
            return Conflict(new { message = $"A {order.Status.ToLowerInvariant()} order can no longer be cancelled." });
        }

        var products = await _db.Products.Include(product => product.Variants)
            .Where(product => order.Items.Select(item => item.ProductId).Contains(product.Id))
            .ToDictionaryAsync(product => product.Id, token);
        var now = DateTime.UtcNow;
        foreach (var item in order.Items)
        {
            if (!products.TryGetValue(item.ProductId, out var product)) continue;
            var previousStock = product.Stock;
            product.Stock += item.Quantity;
            if (item.VariantId.HasValue)
            {
                var variant = product.Variants.SingleOrDefault(entry => entry.Id == item.VariantId.Value);
                if (variant is not null) variant.Stock += item.Quantity;
            }
            _db.StockMovements.Add(new StockMovement
            {
                ProductId = product.Id, ProductName = product.Name, PreviousStock = previousStock,
                QuantityChange = item.Quantity, NewStock = product.Stock, Reason = "Cancellation",
                Note = order.OrderNumber, PerformedBy = User.Identity?.Name ?? "Administrator", CreatedAtUtc = now
            });
        }

        order.Status = OrderStatuses.Cancelled;
        order.PaymentStatus = "Cancelled";
        order.CancellationReason = request.Reason.Trim();
        order.CancelledAtUtc = now;
        order.UpdatedAtUtc = now;
        order.TrackingEvents.Add(new OrderTrackingEvent
        {
            Status = OrderStatuses.Cancelled,
            Message = order.CancellationReason,
            CreatedBy = User.Identity?.Name ?? "Administrator",
            CreatedAtUtc = now
        });
        await _db.SaveChangesAsync(token);
        await transaction.CommitAsync(token);
        return Ok(ToAdminOrderResponse(order));
    }

    private Task<Order?> LoadOrder(int id, CancellationToken token) => _db.Orders
        .Include(order => order.Items)
        .Include(order => order.TrackingEvents)
        .SingleOrDefaultAsync(order => order.Id == id, token);

    private static AdminOrderDetailsResponse ToAdminOrderResponse(Order order) => new()
    {
        Id = order.Id, UserId = order.UserId, OrderNumber = order.OrderNumber,
        PlacedAtUtc = order.PlacedAtUtc, UpdatedAtUtc = order.UpdatedAtUtc, Status = order.Status,
        PaymentMethod = order.PaymentMethod, PaymentStatus = order.PaymentStatus, Subtotal = order.Subtotal,
        DeliveryFee = order.DeliveryFee, Total = order.Total, FullName = order.FullName, Email = order.Email, Phone = order.Phone,
        Address = order.Address, City = order.City, PostalCode = order.PostalCode, Notes = order.Notes,
        Carrier = order.Carrier, TrackingNumber = order.TrackingNumber,
        CancellationReason = order.CancellationReason, CancelledAtUtc = order.CancelledAtUtc,
        CanCancel = OrderStatuses.CanCancel(order.Status), AllowedNextStatuses = OrderStatuses.NextFor(order.Status),
        Items = order.Items.Select(item => new OrderItemResponse { ProductId = item.ProductId, VariantId = item.VariantId, ProductName = item.ProductName, VariantName = item.VariantName, Sku = item.Sku, UnitPrice = item.UnitPrice, Quantity = item.Quantity, LineTotal = item.LineTotal }).ToList(),
        TrackingEvents = order.TrackingEvents.OrderByDescending(item => item.CreatedAtUtc).Select(item => new OrderTrackingEventResponse
        {
            Id = item.Id, Status = item.Status, Message = item.Message,
            CreatedBy = item.CreatedBy, CreatedAtUtc = item.CreatedAtUtc
        }).ToList()
    };

    private static string DefaultStatusMessage(string status) => status switch
    {
        OrderStatuses.Confirmed => "Order confirmed and queued for fulfilment.",
        OrderStatuses.Processing => "Order is being prepared.",
        OrderStatuses.Packed => "Order packed and ready for dispatch.",
        OrderStatuses.Shipped => "Order handed to the delivery carrier.",
        OrderStatuses.Delivered => "Order delivered and Cash on Delivery payment collected.",
        _ => $"Order status changed to {status}."
    };
}
