namespace DocuMind.API.Controllers
{
    using DocuMind.Services.Interfaces;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using System.Security.Claims;

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DocumentsController : ControllerBase
    {
        private readonly IDocumentService _service;

        public DocumentsController(IDocumentService service)
        {
            _service = service;
        }

        private string? GetUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _service.GetAllUserDocumentsAsync(userId);
            return Ok(result);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _service.DeleteUserDocumentAsync(userId, id);

            return success ? Ok() : NotFound();
        }

        [HttpGet("chat/{documentId}")]
        public async Task<IActionResult> GetChat(string documentId)
        {
            var userId = GetUserId();

            var chats = await _service.GetDocumentChatHistory(userId, documentId);

            return Ok(chats);
        }
    }
}
