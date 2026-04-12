namespace DocuMind.API.Controllers
{
    using DocuMind.API.Models;
    using DocuMind.Services.Interfaces;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using System.Security.Claims;

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AIController : ControllerBase
    {
        private readonly IAIService _aiService;

        public AIController(IAIService aiService)
        {
            _aiService = aiService;
        }

        private string? GetUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        [HttpPost("query")]
        public async Task<IActionResult> Query(QueryRequest request)
        {
            var userId = GetUserId();

            var result = await _aiService.AskAI(
                request.Query,
                request.DocumentId,
                userId
            );
            return Content(result, "application/json");
        }
    }
}
