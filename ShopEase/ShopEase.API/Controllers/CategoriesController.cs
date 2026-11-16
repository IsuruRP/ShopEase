using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.API.DTOs;
using ShopEase.API.Models;
using ShopEase.API.Services;

namespace ShopEase.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryResponse>>> GetCategories(
        CancellationToken cancellationToken)
    {
        var categories = (await _categoryService.GetAllAsync(cancellationToken))
            .Select(ToResponse);

        return Ok(categories);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryResponse>> GetCategory(
        int id,
        CancellationToken cancellationToken)
    {
        var category = await _categoryService.GetByIdAsync(id, cancellationToken);

        if (category is null)
        {
            return NotFound(new { message = $"Category with ID {id} was not found." });
        }

        return Ok(ToResponse(category));
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<CategoryResponse>> CreateCategory(
        CreateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var category = await _categoryService.CreateAsync(request, cancellationToken);
        var response = ToResponse(category);

        return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, response);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> UpdateCategory(
        int id,
        UpdateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var category = await _categoryService.UpdateAsync(id, request, cancellationToken);

        if (category is null)
        {
            return NotFound(new { message = $"Category with ID {id} was not found." });
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> DeleteCategory(
        int id,
        CancellationToken cancellationToken)
    {
        var result = await _categoryService.DeleteAsync(id, cancellationToken);

        return result switch
        {
            CategoryDeleteResult.Deleted => NoContent(),
            CategoryDeleteResult.NotFound => NotFound(
                new { message = $"Category with ID {id} was not found." }),
            CategoryDeleteResult.HasProducts => Conflict(
                new { message = "This category cannot be deleted because it contains products." }),
            _ => throw new InvalidOperationException("Unknown category delete result.")
        };
    }

    private static CategoryResponse ToResponse(Category category)
    {
        return new CategoryResponse
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            ProductCount = category.Products.Count
        };
    }
}
