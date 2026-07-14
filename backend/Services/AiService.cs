using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace PartnerApprovalPortal.API.Services
{
    public interface IAiService
    {
        Task<List<string>> SuggestCategoriesAsync(string description);
        Task<NormalizedAddress> NormalizeAddressAsync(string rawAddress);
    }

    public class NormalizedAddress
    {
        public string Street { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public bool IsAiNormalized { get; set; }
    }

    public class AiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AiService> _logger;
        private readonly string _lmStudioUrl;
        private readonly string _modelName;

        public AiService(HttpClient httpClient, IConfiguration configuration, ILogger<AiService> logger)
        {
            _httpClient = httpClient;
            // Set short timeout (e.g., 3 seconds) so if LM Studio is offline, it falls back instantly
            _httpClient.Timeout = TimeSpan.FromSeconds(3);
            _logger = logger;
            
            _lmStudioUrl = configuration.GetValue<string>("AiSettings:LmStudioUrl") ?? "http://localhost:1234/v1/chat/completions";
            _modelName = configuration.GetValue<string>("AiSettings:ModelName") ?? "gemma";
        }

        public async Task<List<string>> SuggestCategoriesAsync(string description)
        {
            if (string.IsNullOrWhiteSpace(description))
            {
                return new List<string> { "General Partner", "Service Provider" };
            }

            try
            {
                _logger.LogInformation("Attempting AI category suggestion using local LM Studio at {Url}...", _lmStudioUrl);
                
                var requestBody = new
                {
                    model = _modelName,
                    messages = new[]
                    {
                        new { role = "system", content = "You are a category assistant for Dr. Reddy's Pharmaceuticals. Given a partner company description, suggest exactly 3 relevant business partner categories (e.g., 'API Supplier', 'Logistics Partner', 'Clinical Research Org', 'Packaging Vendor', 'IT Services', 'Marketing Agency', 'Regulatory Consultant'). Output ONLY a raw JSON array of strings, for example: [\"Category 1\", \"Category 2\", \"Category 3\"]. Do not write markdown, code blocks, or explanations." },
                        new { role = "user", content = $"Suggest categories for this description: {description}" }
                    },
                    temperature = 0.1,
                    max_tokens = 100
                };

                var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(_lmStudioUrl, content);

                if (response.IsSuccessStatusCode)
                {
                    var responseString = await response.Content.ReadAsStringAsync();
                    var openAiResponse = JsonSerializer.Deserialize<OpenAiChatResponse>(responseString);
                    var aiText = openAiResponse?.Choices?[0]?.Message?.Content?.Trim() ?? string.Empty;
                    
                    _logger.LogInformation("LM Studio Category Response: {Response}", aiText);

                    // Clean markdown code blocks if the model returned them
                    if (aiText.StartsWith("```"))
                    {
                        aiText = aiText.Replace("```json", "").Replace("```", "").Trim();
                    }

                    var suggestions = JsonSerializer.Deserialize<List<string>>(aiText);
                    if (suggestions != null && suggestions.Count > 0)
                    {
                        return suggestions;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("LM Studio suggestion failed or offline. Using static rules fallback. Error: {Message}", ex.Message);
            }

            // Fallback Heuristics
            return GetStaticCategoryFallback(description);
        }

        public async Task<NormalizedAddress> NormalizeAddressAsync(string rawAddress)
        {
            if (string.IsNullOrWhiteSpace(rawAddress))
            {
                return new NormalizedAddress { IsAiNormalized = false };
            }

            try
            {
                _logger.LogInformation("Attempting AI address normalization using local LM Studio at {Url}...", _lmStudioUrl);

                var requestBody = new
                {
                    model = _modelName,
                    messages = new[]
                    {
                        new { role = "system", content = "You are an address normalization assistant. Parse the input address and return a raw JSON object with fields: Street, City, State, Country, ZipCode. Output ONLY raw valid JSON. Do not include markdown code blocks or descriptions. If a field is missing, set it to an empty string. Example output: {\"Street\": \"123 Banjara Hills\", \"City\": \"Hyderabad\", \"State\": \"Telangana\", \"Country\": \"India\", \"ZipCode\": \"500034\"}" },
                        new { role = "user", content = $"Normalize this address: {rawAddress}" }
                    },
                    temperature = 0.1,
                    max_tokens = 200
                };

                var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(_lmStudioUrl, content);

                if (response.IsSuccessStatusCode)
                {
                    var responseString = await response.Content.ReadAsStringAsync();
                    var openAiResponse = JsonSerializer.Deserialize<OpenAiChatResponse>(responseString);
                    var aiText = openAiResponse?.Choices?[0]?.Message?.Content?.Trim() ?? string.Empty;

                    _logger.LogInformation("LM Studio Address Response: {Response}", aiText);

                    if (aiText.StartsWith("```"))
                    {
                        aiText = aiText.Replace("```json", "").Replace("```", "").Trim();
                    }

                    var normalized = JsonSerializer.Deserialize<NormalizedAddress>(aiText, new JsonSerializerOptions 
                    { 
                        PropertyNameCaseInsensitive = true 
                    });

                    if (normalized != null)
                    {
                        normalized.IsAiNormalized = true;
                        return normalized;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("LM Studio address normalization failed or offline. Using fallback parser. Error: {Message}", ex.Message);
            }

            // Fallback heuristic parser
            return GetStaticAddressFallback(rawAddress);
        }

        private List<string> GetStaticCategoryFallback(string description)
        {
            var text = description.ToLower();
            var suggestions = new List<string>();

            if (text.Contains("research") || text.Contains("clinical") || text.Contains("trial") || text.Contains("lab"))
            {
                suggestions.Add("Clinical Research Org (CRO)");
                suggestions.Add("R&D Partner");
                suggestions.Add("Scientific Service Provider");
            }
            else if (text.Contains("delivery") || text.Contains("ship") || text.Contains("transport") || text.Contains("logistics") || text.Contains("warehouse"))
            {
                suggestions.Add("Logistics & Distribution");
                suggestions.Add("Cold Chain Vendor");
                suggestions.Add("Supply Chain Partner");
            }
            else if (text.Contains("chemical") || text.Contains("ingredient") || text.Contains("raw") || text.Contains("api") || text.Contains("substance"))
            {
                suggestions.Add("API & Raw Materials Supplier");
                suggestions.Add("Chemical Manufacturer");
                suggestions.Add("Excipient Supplier");
            }
            else if (text.Contains("software") || text.Contains("it") || text.Contains("code") || text.Contains("cloud") || text.Contains("computer") || text.Contains("tech"))
            {
                suggestions.Add("IT & Software Services");
                suggestions.Add("SaaS Provider");
                suggestions.Add("Digital Health Partner");
            }
            else if (text.Contains("pack") || text.Contains("box") || text.Contains("bottle") || text.Contains("label"))
            {
                suggestions.Add("Packaging Vendor");
                suggestions.Add("Printing & Labeling");
                suggestions.Add("Materials Supplier");
            }
            else
            {
                // Default options
                suggestions.Add("General Service Provider");
                suggestions.Add("Commercial Partner");
                suggestions.Add("Consulting & Advisory");
            }

            return suggestions;
        }

        private NormalizedAddress GetStaticAddressFallback(string rawAddress)
        {
            var normalized = new NormalizedAddress
            {
                IsAiNormalized = false
            };

            // Simple parser: split by commas
            var parts = rawAddress.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            
            if (parts.Length > 0)
            {
                // Let's make a guess
                if (parts.Length == 1)
                {
                    normalized.Street = parts[0];
                }
                else if (parts.Length == 2)
                {
                    normalized.Street = parts[0];
                    normalized.City = parts[1];
                }
                else if (parts.Length == 3)
                {
                    normalized.Street = parts[0];
                    normalized.City = parts[1];
                    normalized.Country = parts[2];
                }
                else if (parts.Length >= 4)
                {
                    normalized.Street = string.Join(", ", parts[0..^3]);
                    normalized.City = parts[^3];
                    normalized.State = parts[^2];
                    normalized.Country = parts[^1];
                }

                // If Country contains zip code, extract it (e.g. "India 500034" or "500034")
                ExtractZipCode(normalized);
            }

            return normalized;
        }

        private void ExtractZipCode(NormalizedAddress address)
        {
            // Simple check for numbers in Country or State to extract zip code
            var checkFields = new[] { address.Country, address.State, address.City };
            foreach (var field in checkFields)
            {
                if (string.IsNullOrEmpty(field)) continue;
                var match = System.Text.RegularExpressions.Regex.Match(field, @"\b\d{5,6}\b");
                if (match.Success)
                {
                    address.ZipCode = match.Value;
                    break;
                }
            }
        }
    }

    // Helper classes for parsing OpenAI-style completions
    public class OpenAiChatResponse
    {
        [JsonPropertyName("choices")]
        public List<OpenAiChoice>? Choices { get; set; }
    }

    public class OpenAiChoice
    {
        [JsonPropertyName("message")]
        public OpenAiMessage? Message { get; set; }
    }

    public class OpenAiMessage
    {
        [JsonPropertyName("content")]
        public string? Content { get; set; }
    }
}
