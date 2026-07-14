using Microsoft.EntityFrameworkCore;
using PartnerApprovalPortal.API.Models;

namespace PartnerApprovalPortal.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Partner> Partners { get; set; } = null!;
        public DbSet<ApprovalHistory> ApprovalHistories { get; set; } = null!;
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Seed a couple of default partners for the demo
            modelBuilder.Entity<Partner>().HasData(
                new Partner
                {
                    Id = 1,
                    Name = "Acme Pharmaceuticals",
                    Email = "info@acmepharma.com",
                    Phone = "1234567890",
                    Organization = "Acme Corp",
                    Category = "Medical Equipment",
                    Address = "101 Silicon Valley, San Jose, CA, USA",
                    PaymentInfo = "Bank Wire - Account Ending in 4321",
                    Status = "Draft",
                    CreatedBy = "Employee",
                    CreatedDate = DateTime.UtcNow.AddDays(-5)
                },
                new Partner
                {
                    Id = 2,
                    Name = "BioHealth Diagnostics",
                    Email = "contact@biohealth.org",
                    Phone = "9876543210",
                    Organization = "BioHealth Foundation",
                    Category = "Diagnostics",
                    Address = "456 Cyber Towers, Hyderabad, Telangana, India",
                    PaymentInfo = "ACH - Route: 111000025, Acct: 998877",
                    Status = "Submitted",
                    CreatedBy = "Employee",
                    CreatedDate = DateTime.UtcNow.AddDays(-2)
                }
            );
        }
    }
}
