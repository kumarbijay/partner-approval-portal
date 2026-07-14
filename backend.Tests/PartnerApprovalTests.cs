using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq; // Wait, do we have Moq? If not, we can write manual mocks or install Moq. 
// Actually, let's write simple manual mocks/stubs to avoid installing another package, or just test the controller with direct instantiations.
// We can use Microsoft.EntityFrameworkCore.InMemory directly to test the controller. Let's do that!
using PartnerApprovalPortal.API.Controllers;
using PartnerApprovalPortal.API.Data;
using PartnerApprovalPortal.API.DTOs;
using PartnerApprovalPortal.API.Models;
using PartnerApprovalPortal.API.Services;
using Xunit;

namespace PartnerApprovalPortal.Tests
{
    public class PartnerApprovalTests
    {
        private DbContextOptions<ApplicationDbContext> GetInMemoryOptions(string dbName)
        {
            return new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
        }

        [Fact]
        public async Task CreatePartner_ShouldStartInDraftStatus()
        {
            // Arrange
            var options = GetInMemoryOptions("CreatePartnerDb");
            using var context = new ApplicationDbContext(options);
            var controller = new PartnersController(context);
            
            var newPartner = new CreatePartnerDto
            {
                Name = "Test Partner",
                Email = "test@partner.com",
                Phone = "1234567890",
                Organization = "Test Org",
                Category = "Consulting",
                Address = "123 Test St, Test City, TS, India",
                PaymentInfo = "Bank Wire - Placeholder Info"
            };

            // Act
            var result = await controller.CreatePartner(newPartner);

            // Assert
            var actionResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var partner = Assert.IsType<Partner>(actionResult.Value);
            
            Assert.Equal("Draft", partner.Status);
            Assert.Equal("Employee", partner.CreatedBy);
            
            // Verify audit log was created
            var audit = context.AuditLogs.FirstOrDefault(a => a.PartnerId == partner.Id);
            Assert.NotNull(audit);
            Assert.Equal("Created", audit.Action);
        }

        [Fact]
        public async Task SubmitPartner_ShouldTransitionStatusToSubmitted()
        {
            // Arrange
            var options = GetInMemoryOptions("SubmitPartnerDb");
            using var context = new ApplicationDbContext(options);
            
            var partner = new Partner
            {
                Id = 10,
                Name = "Draft Partner",
                Email = "draft@partner.com",
                Status = "Draft"
            };
            context.Partners.Add(partner);
            await context.SaveChangesAsync();

            var controller = new PartnersController(context);

            // Act
            var result = await controller.SubmitPartner(partner.Id);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Submitted", partner.Status);

            // Verify approval history was updated
            var history = context.ApprovalHistories.FirstOrDefault(h => h.PartnerId == partner.Id);
            Assert.NotNull(history);
            Assert.Equal("Draft", history.OldStatus);
            Assert.Equal("Submitted", history.NewStatus);
        }

        [Fact]
        public async Task ApprovePartner_ShouldTransitionSubmittedToApproved()
        {
            // Arrange
            var options = GetInMemoryOptions("ApprovePartnerDb");
            using var context = new ApplicationDbContext(options);
            
            var partner = new Partner
            {
                Id = 20,
                Name = "Submitted Partner",
                Email = "submitted@partner.com",
                Status = "Submitted"
            };
            context.Partners.Add(partner);
            await context.SaveChangesAsync();

            var controller = new PartnersController(context);
            var reviewDto = new ReviewDto
            {
                Comment = "Passed due diligence check.",
                ReviewerName = "Reviewer Bob"
            };

            // Act
            var result = await controller.ApprovePartner(partner.Id, reviewDto);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Approved", partner.Status);

            // Verify history comment and user
            var history = context.ApprovalHistories.FirstOrDefault(h => h.PartnerId == partner.Id && h.NewStatus == "Approved");
            Assert.NotNull(history);
            Assert.Equal("Passed due diligence check.", history.Comment);
            Assert.Equal("Reviewer Bob", history.ChangedBy);
        }

        [Fact]
        public async Task AIFallback_ShouldParseCategoryCorrectly()
        {
            // Arrange
            var inMemorySettings = new Dictionary<string, string> {
                {"AiSettings:LmStudioUrl", "http://localhost:1234/v1/chat/completions"},
                {"AiSettings:ModelName", "gemma"}
            };
            IConfiguration configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            var mockLogger = new Mock<ILogger<AiService>>();
            var mockHandler = new Mock<HttpMessageHandler>(); // Fallback HTTP client
            var client = new HttpClient(mockHandler.Object);

            var aiService = new AiService(client, configuration, mockLogger.Object);

            // Act & Assert
            // 1. Research keywords
            var resSuggestions = await aiService.SuggestCategoriesAsync("We focus on clinical research and trials.");
            Assert.Contains("Clinical Research Org (CRO)", resSuggestions);

            // 2. Logistics keywords
            var logSuggestions = await aiService.SuggestCategoriesAsync("We handle shipping, delivery, and cold chain storage.");
            Assert.Contains("Logistics & Distribution", logSuggestions);

            // 3. Address split parser fallback
            var addressResult = await aiService.NormalizeAddressAsync("123 Banjara Hills, Hyderabad, Telangana, India");
            Assert.Equal("123 Banjara Hills", addressResult.Street);
            Assert.Equal("Hyderabad", addressResult.City);
            Assert.Equal("Telangana", addressResult.State);
            Assert.Equal("India", addressResult.Country);
            Assert.False(addressResult.IsAiNormalized); // Since HTTP failed, it ran the static fallback
        }
    }
}
