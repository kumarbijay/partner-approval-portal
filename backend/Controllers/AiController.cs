using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PartnerApprovalPortal.API.Services;

namespace PartnerApprovalPortal.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        private readonly IAiService _aiService;

        public AiController(IAiService aiService)
        {
            _aiService = aiService;
        }

        // GET: api/ai/suggest-category?description=clinical trials
        [HttpGet("suggest-category")]
        public async Task<ActionResult<IEnumerable<string>>> SuggestCategory([Required][FromQuery] string description)
        {
            if (string.IsNullOrWhiteSpace(description))
            {
                return BadRequest(new { message = "Description parameter is required." });
            }

            var suggestions = await _aiService.SuggestCategoriesAsync(description);
            return Ok(suggestions);
        }

        // POST: api/ai/normalize-address
        [HttpPost("normalize-address")]
        public async Task<ActionResult<NormalizedAddress>> NormalizeAddress([FromBody] AddressRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.RawAddress))
            {
                return BadRequest(new { message = "RawAddress is required in the request body." });
            }

            var normalized = await _aiService.NormalizeAddressAsync(request.RawAddress);
            return Ok(normalized);
        }
    }

    public class AddressRequest
    {
        [Required]
        public string RawAddress { get; set; } = string.Empty;
    }
}
