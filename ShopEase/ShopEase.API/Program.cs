
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
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
builder.Services.Configure<AdminSeedOptions>(
    builder.Configuration.GetSection(AdminSeedOptions.SectionName));
builder.Services.Configure<PasswordRecoveryOptions>(
    builder.Configuration.GetSection(PasswordRecoveryOptions.SectionName));
builder.Services.Configure<OrderNotificationOptions>(
    builder.Configuration.GetSection(OrderNotificationOptions.SectionName));
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
            ClockSkew = TimeSpan.Zero,
            NameClaimType = System.Security.Claims.ClaimTypes.Name,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // Deliberately ignore Authorization headers: browser sessions only use the HttpOnly cookie.
                var cookieToken = context.Request.Cookies[AuthCookieDefaults.Name];
                if (string.IsNullOrEmpty(cookieToken)) context.NoResult();
                else context.Token = cookieToken;
                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var userIdValue = context.Principal?.FindFirst(
                    System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var tokenVersionValue = context.Principal?.FindFirst("token_version")?.Value;

                if (!int.TryParse(userIdValue, out var userId) ||
                    !int.TryParse(tokenVersionValue, out var tokenVersion))
                {
                    context.Fail("Invalid session claims.");
                    return;
                }

                var db = context.HttpContext.RequestServices.GetRequiredService<ShopEaseDbContext>();
                var currentVersion = await db.Users
                    .Where(user => user.Id == userId)
                    .Select(user => (int?)user.TokenVersion)
                    .SingleOrDefaultAsync(context.HttpContext.RequestAborted);

                if (currentVersion is null || currentVersion.Value != tokenVersion)
                {
                    context.Fail("This session has been revoked.");
                }
            }
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.AddPolicy("checkout", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(10),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("ShopEaseClient", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var connectionString = builder.Configuration.GetConnectionString("ShopEaseDatabase")
    ?? throw new InvalidOperationException(
        "Connection string 'ShopEaseDatabase' was not found.");

builder.Services.AddDbContext<ShopEaseDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<IPasswordResetEmailSender, PasswordResetEmailSender>();
builder.Services.AddScoped<AdminSeeder>();
builder.Services.AddScoped<IOrderEmailSender, OrderEmailSender>();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    await scope.ServiceProvider.GetRequiredService<AdminSeeder>().SeedAsync();
}

app.UseMiddleware<RequestLoggingMiddleware>();
app.UseExceptionHandler();
app.UseStaticFiles();
app.UseCors("ShopEaseClient");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () =>
{
    return "Welcome to ShopEase API!";
});

app.MapControllers();

app.Run();
