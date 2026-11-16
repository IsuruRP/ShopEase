
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ShopEase.API.Data;
using ShopEase.API.ExceptionHandling;
using ShopEase.API.Middleware;
using ShopEase.API.Models;
using ShopEase.API.Options;
using ShopEase.API.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

var jwtOptions = builder.Configuration
    .GetRequiredSection(JwtOptions.SectionName)
    .Get<JwtOptions>()
    ?? throw new InvalidOperationException("JWT configuration was not found.");

if (Encoding.UTF8.GetByteCount(jwtOptions.Key) < 32)
{
    throw new InvalidOperationException("JWT signing key must be at least 32 bytes long.");
}

builder.Services.Configure<JwtOptions>(
    builder.Configuration.GetRequiredSection(JwtOptions.SectionName));
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization();

var connectionString = builder.Configuration.GetConnectionString("ShopEaseDatabase")
    ?? throw new InvalidOperationException(
        "Connection string 'ShopEaseDatabase' was not found.");

builder.Services.AddDbContext<ShopEaseDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

var app = builder.Build();

app.UseMiddleware<RequestLoggingMiddleware>();
app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () =>
{
    return "Welcome to ShopEase API!";
});

app.MapControllers();

app.Run();
