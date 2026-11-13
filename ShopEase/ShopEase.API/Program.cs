
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var app = builder.Build();

app.MapGet("/", () =>
{
    return "Welcome to ShopEase API!";
});

app.MapControllers();

app.Run();