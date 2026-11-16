using System.ComponentModel.DataAnnotations;

namespace ShopEase.API.DTOs;

public class CreateCategoryRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = "";

    [StringLength(500)]
    public string Description { get; set; } = "";
}
