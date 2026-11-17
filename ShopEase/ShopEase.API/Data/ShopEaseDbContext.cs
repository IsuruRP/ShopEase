using Microsoft.EntityFrameworkCore;
using ShopEase.API.Models;

namespace ShopEase.API.Data
{
    public class ShopEaseDbContext : DbContext
    {
        public ShopEaseDbContext(DbContextOptions<ShopEaseDbContext> options)
            : base(options)
        {
        }

        public DbSet<Product> Products => Set<Product>();

        public DbSet<Category> Categories => Set<Category>();

        public DbSet<User> Users => Set<User>();
        public DbSet<Order> Orders => Set<Order>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();
        public DbSet<ShippingAddress> ShippingAddresses => Set<ShippingAddress>();
        public DbSet<StockMovement> StockMovements => Set<StockMovement>();
        public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
        public DbSet<OrderTrackingEvent> OrderTrackingEvents => Set<OrderTrackingEvent>();
        public DbSet<ProductImage> ProductImages => Set<ProductImage>();
        public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
        public DbSet<ProductSpecification> ProductSpecifications => Set<ProductSpecification>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            var stockMovement = modelBuilder.Entity<StockMovement>();
            stockMovement.ToTable("StockMovements");
            stockMovement.HasKey(item => item.Id);
            stockMovement.Property(item => item.ProductName).HasMaxLength(200).IsRequired();
            stockMovement.Property(item => item.Reason).HasMaxLength(50).IsRequired();
            stockMovement.Property(item => item.Note).HasMaxLength(300);
            stockMovement.Property(item => item.PerformedBy).HasMaxLength(100).IsRequired();
            stockMovement.HasIndex(item => item.CreatedAtUtc);
            stockMovement.HasIndex(item => item.ProductId);

            var shippingAddress = modelBuilder.Entity<ShippingAddress>();
            shippingAddress.ToTable("ShippingAddresses");
            shippingAddress.HasKey(item => item.Id);
            shippingAddress.Property(item => item.Label).HasMaxLength(30).IsRequired();
            shippingAddress.Property(item => item.FullName).HasMaxLength(100).IsRequired();
            shippingAddress.Property(item => item.Phone).HasMaxLength(30).IsRequired();
            shippingAddress.Property(item => item.Address).HasMaxLength(300).IsRequired();
            shippingAddress.Property(item => item.City).HasMaxLength(100).IsRequired();
            shippingAddress.Property(item => item.PostalCode).HasMaxLength(20).IsRequired();
            shippingAddress.HasOne<User>().WithMany().HasForeignKey(item => item.UserId).OnDelete(DeleteBehavior.Cascade);

            var order = modelBuilder.Entity<Order>();
            order.ToTable("Orders");
            order.HasKey(item => item.Id);
            order.Property(item => item.OrderNumber).HasMaxLength(30).IsRequired();
            order.HasIndex(item => item.OrderNumber).IsUnique();
            order.Property(item => item.Status).HasMaxLength(30).IsRequired();
            order.Property(item => item.PaymentMethod).HasMaxLength(30).IsRequired();
            order.Property(item => item.PaymentStatus).HasMaxLength(30).IsRequired();
            order.Property(item => item.FullName).HasMaxLength(100).IsRequired();
            order.Property(item => item.Email).HasMaxLength(254).IsRequired();
            order.Property(item => item.Phone).HasMaxLength(30).IsRequired();
            order.Property(item => item.Address).HasMaxLength(300).IsRequired();
            order.Property(item => item.City).HasMaxLength(100).IsRequired();
            order.Property(item => item.PostalCode).HasMaxLength(20).IsRequired();
            order.Property(item => item.Notes).HasMaxLength(500);
            order.Property(item => item.Carrier).HasMaxLength(100);
            order.Property(item => item.TrackingNumber).HasMaxLength(100);
            order.Property(item => item.CancellationReason).HasMaxLength(500);
            order.Property(item => item.Subtotal).HasPrecision(18, 2);
            order.Property(item => item.DeliveryFee).HasPrecision(18, 2);
            order.Property(item => item.Total).HasPrecision(18, 2);
            order.HasOne<User>().WithMany().HasForeignKey(item => item.UserId).OnDelete(DeleteBehavior.SetNull);

            var trackingEvent = modelBuilder.Entity<OrderTrackingEvent>();
            trackingEvent.ToTable("OrderTrackingEvents");
            trackingEvent.HasKey(item => item.Id);
            trackingEvent.Property(item => item.Status).HasMaxLength(30).IsRequired();
            trackingEvent.Property(item => item.Message).HasMaxLength(500).IsRequired();
            trackingEvent.Property(item => item.CreatedBy).HasMaxLength(100).IsRequired();
            trackingEvent.HasIndex(item => new { item.OrderId, item.CreatedAtUtc });
            trackingEvent.HasOne(item => item.Order)
                .WithMany(item => item.TrackingEvents)
                .HasForeignKey(item => item.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            var orderItem = modelBuilder.Entity<OrderItem>();
            orderItem.ToTable("OrderItems");
            orderItem.HasKey(item => item.Id);
            orderItem.Property(item => item.ProductName).HasMaxLength(200).IsRequired();
            orderItem.Property(item => item.VariantName).HasMaxLength(150);
            orderItem.Property(item => item.Sku).HasMaxLength(80).IsRequired();
            orderItem.Property(item => item.UnitPrice).HasPrecision(18, 2);
            orderItem.Property(item => item.LineTotal).HasPrecision(18, 2);
            orderItem.HasOne(item => item.Order).WithMany(item => item.Items).HasForeignKey(item => item.OrderId).OnDelete(DeleteBehavior.Cascade);

            var user = modelBuilder.Entity<User>();

            user.ToTable("Users");
            user.HasKey(item => item.Id);
            user.Property(item => item.Username).HasMaxLength(50).IsRequired();
            user.Property(item => item.NormalizedUsername).HasMaxLength(50).IsRequired();
            user.Property(item => item.PasswordHash).HasMaxLength(500).IsRequired();
            user.Property(item => item.Role).HasMaxLength(20).IsRequired();
            user.Property(item => item.FullName).HasMaxLength(100).IsRequired();
            user.Property(item => item.Email).HasMaxLength(254).IsRequired();
            user.Property(item => item.NormalizedEmail).HasMaxLength(254);
            user.Property(item => item.Phone).HasMaxLength(30).IsRequired();
            user.HasIndex(item => item.NormalizedUsername).IsUnique();
            user.HasIndex(item => item.NormalizedEmail)
                .IsUnique()
                .HasFilter("[NormalizedEmail] IS NOT NULL");

            var passwordResetToken = modelBuilder.Entity<PasswordResetToken>();
            passwordResetToken.ToTable("PasswordResetTokens");
            passwordResetToken.HasKey(item => item.Id);
            passwordResetToken.Property(item => item.TokenHash).HasMaxLength(64).IsRequired();
            passwordResetToken.HasIndex(item => item.TokenHash).IsUnique();
            passwordResetToken.HasIndex(item => new { item.UserId, item.ExpiresAtUtc });
            passwordResetToken.HasOne(item => item.User)
                .WithMany()
                .HasForeignKey(item => item.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            var category = modelBuilder.Entity<Category>();

            category.ToTable("Categories");
            category.HasKey(item => item.Id);
            category.Property(item => item.Name).HasMaxLength(100).IsRequired();
            category.Property(item => item.Description).HasMaxLength(500);

            var product = modelBuilder.Entity<Product>();

            product.ToTable("Products");
            product.HasKey(item => item.Id);
            product.Property(item => item.Name).HasMaxLength(200).IsRequired();
            product.Property(item => item.Description).HasMaxLength(1000);
            product.Property(item => item.Sku).HasMaxLength(80).IsRequired();
            product.Property(item => item.Brand).HasMaxLength(100).IsRequired();
            product.Property(item => item.Price).HasPrecision(18, 2);
            product.HasIndex(item => item.Sku).IsUnique();
            product.HasIndex(item => item.Brand);
            product.HasIndex(item => new { item.CategoryId, item.Price });
            product.HasIndex(item => item.Stock);
            product.HasOne(item => item.Category)
                .WithMany(item => item.Products)
                .HasForeignKey(item => item.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            var productImage = modelBuilder.Entity<ProductImage>();
            productImage.ToTable("ProductImages");
            productImage.HasKey(item => item.Id);
            productImage.Property(item => item.Url).HasMaxLength(500).IsRequired();
            productImage.Property(item => item.AltText).HasMaxLength(200);
            productImage.HasIndex(item => new { item.ProductId, item.SortOrder });
            productImage.HasOne(item => item.Product).WithMany(item => item.Images)
                .HasForeignKey(item => item.ProductId).OnDelete(DeleteBehavior.Cascade);

            var productVariant = modelBuilder.Entity<ProductVariant>();
            productVariant.ToTable("ProductVariants");
            productVariant.HasKey(item => item.Id);
            productVariant.Property(item => item.Name).HasMaxLength(150).IsRequired();
            productVariant.Property(item => item.Sku).HasMaxLength(80).IsRequired();
            productVariant.Property(item => item.Price).HasPrecision(18, 2);
            productVariant.HasIndex(item => item.Sku).IsUnique();
            productVariant.HasOne(item => item.Product).WithMany(item => item.Variants)
                .HasForeignKey(item => item.ProductId).OnDelete(DeleteBehavior.Cascade);

            var productSpecification = modelBuilder.Entity<ProductSpecification>();
            productSpecification.ToTable("ProductSpecifications");
            productSpecification.HasKey(item => item.Id);
            productSpecification.Property(item => item.Name).HasMaxLength(100).IsRequired();
            productSpecification.Property(item => item.Value).HasMaxLength(500).IsRequired();
            productSpecification.HasIndex(item => new { item.ProductId, item.SortOrder });
            productSpecification.HasOne(item => item.Product).WithMany(item => item.Specifications)
                .HasForeignKey(item => item.ProductId).OnDelete(DeleteBehavior.Cascade);

            category.HasData(
                new Category
                {
                    Id = 1,
                    Name = "Computers",
                    Description = "Computers and related devices"
                },
                new Category
                {
                    Id = 2,
                    Name = "Mobile Phones",
                    Description = "Smartphones and mobile devices"
                });

            product.HasData(
                new Product
                {
                    Id = 1,
                    Name = "Laptop",
                    Description = "Gaming Laptop",
                    Sku = "SE-P-0001",
                    Brand = "ShopEase",
                    Price = 250000m,
                    Stock = 10,
                    CategoryId = 1
                },
                new Product
                {
                    Id = 2,
                    Name = "Smartphone",
                    Description = "Android Phone",
                    Sku = "SE-P-0002",
                    Brand = "ShopEase",
                    Price = 85000m,
                    Stock = 20,
                    CategoryId = 2
                });
        }
    }
}
