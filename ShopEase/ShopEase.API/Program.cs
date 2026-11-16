
using Microsoft.EntityFrameworkCore;
using ShopEase.API.Data;
using ShopEase.API.ExceptionHandling;
using ShopEase.API.Middleware;
using ShopEase.API.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

var connectionString = builder.Configuration.GetConnectionString("ShopEaseDatabase")
    ?? throw new InvalidOperationException(
        "Connection string 'ShopEaseDatabase' was not found.");

builder.Services.AddDbContext<ShopEaseDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<IProductService, ProductService>();

var app = builder.Build();

app.UseMiddleware<RequestLoggingMiddleware>();
app.UseExceptionHandler();

app.MapGet("/", () =>
{
    return "Welcome to ShopEase API!";
});

app.MapControllers();

app.Run();
