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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
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
            product.Property(item => item.Price).HasPrecision(18, 2);
            product.HasOne(item => item.Category)
                .WithMany(item => item.Products)
                .HasForeignKey(item => item.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

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
                    Price = 250000m,
                    Stock = 10,
                    CategoryId = 1
                },
                new Product
                {
                    Id = 2,
                    Name = "Smartphone",
                    Description = "Android Phone",
                    Price = 85000m,
                    Stock = 20,
                    CategoryId = 2
                });
        }
    }
}
