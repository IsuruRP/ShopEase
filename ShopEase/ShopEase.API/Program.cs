
using Microsoft.EntityFrameworkCore;
using ShopEase.API.Data;
using ShopEase.API.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var connectionString = builder.Configuration.GetConnectionString("ShopEaseDatabase")
    ?? throw new InvalidOperationException(
        "Connection string 'ShopEaseDatabase' was not found.");

builder.Services.AddDbContext<ShopEaseDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<IProductService, ProductService>();

var app = builder.Build();

app.MapGet("/", () =>
{
    return "Welcome to ShopEase API!";
});

app.MapControllers();

app.Run();
