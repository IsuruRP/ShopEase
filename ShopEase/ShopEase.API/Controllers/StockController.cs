using System.Data;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopEase.API.Data;
using ShopEase.API.DTOs;
using ShopEase.API.Models;

namespace ShopEase.API.Controllers;

[ApiController, Authorize(Roles = UserRoles.Admin), Route("api/stock")]
public class StockController : ControllerBase
{
    private const int LowStockThreshold = 5;
    private const int MaximumStock = 1000000;
    private static readonly HashSet<string> AllowedReasons = new(StringComparer.OrdinalIgnoreCase)
    {
        "Restock", "Correction", "Customer return", "Damaged", "Other"
    };
    private readonly ShopEaseDbContext _db;

    public StockController(ShopEaseDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<StockManagementResponse>> Get(CancellationToken token)
    {
        var products = await _db.Products.AsNoTracking().OrderBy(product => product.Name)
            .Select(product => new StockProductResponse { Id = product.Id, Name = product.Name, CategoryName = product.Category.Name, Stock = product.Stock })
            .ToListAsync(token);
        var movements = await _db.StockMovements.AsNoTracking().OrderByDescending(item => item.CreatedAtUtc).Take(20)
            .Select(item => new StockMovementResponse { Id = item.Id, ProductId = item.ProductId, ProductName = item.ProductName, PreviousStock = item.PreviousStock, QuantityChange = item.QuantityChange, NewStock = item.NewStock, Reason = item.Reason, Note = item.Note, PerformedBy = item.PerformedBy, CreatedAtUtc = item.CreatedAtUtc })
            .ToListAsync(token);

        return Ok(new StockManagementResponse
        {
            TotalProducts = products.Count,
            TotalUnits = products.Sum(product => product.Stock),
            LowStockCount = products.Count(product => product.Stock > 0 && product.Stock <= LowStockThreshold),
            OutOfStockCount = products.Count(product => product.Stock == 0),
            Products = products,
            RecentMovements = movements
        });
    }

    [HttpPost("adjustments")]
    public async Task<ActionResult<StockMovementResponse>> Adjust(AdjustStockRequest request, CancellationToken token)
    {
        if (request.QuantityChange == 0) return BadRequest(new { message = "Stock change cannot be zero." });
        if (!AllowedReasons.Contains(request.Reason.Trim())) return BadRequest(new { message = "Select a valid stock adjustment reason." });

        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable, token);
        var product = await _db.Products.SingleOrDefaultAsync(item => item.Id == request.ProductId, token);
        if (product is null) return NotFound(new { message = "Product was not found." });

        var newStock = product.Stock + request.QuantityChange;
        if (newStock < 0) return Conflict(new { message = $"Stock cannot fall below zero. {product.Name} currently has {product.Stock} units." });
        if (newStock > MaximumStock) return Conflict(new { message = $"Stock cannot exceed {MaximumStock:N0} units." });

        var movement = new StockMovement
        {
            ProductId = product.Id,
            ProductName = product.Name,
            PreviousStock = product.Stock,
            QuantityChange = request.QuantityChange,
            NewStock = newStock,
            Reason = request.Reason.Trim(),
            Note = request.Note.Trim(),
            PerformedBy = User.FindFirstValue(ClaimTypes.Name) ?? "Admin",
            CreatedAtUtc = DateTime.UtcNow
        };
        product.Stock = newStock;
        _db.StockMovements.Add(movement);
        await _db.SaveChangesAsync(token);
        await transaction.CommitAsync(token);

        return Ok(new StockMovementResponse { Id = movement.Id, ProductId = movement.ProductId, ProductName = movement.ProductName, PreviousStock = movement.PreviousStock, QuantityChange = movement.QuantityChange, NewStock = movement.NewStock, Reason = movement.Reason, Note = movement.Note, PerformedBy = movement.PerformedBy, CreatedAtUtc = movement.CreatedAtUtc });
    }
}
