
using ShopEase.API.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<IProductService, ProductService>();

var app = builder.Build();

app.MapGet("/", () =>
{
    return "Welcome to ShopEase API!";
});

app.MapControllers();

app.Run();
