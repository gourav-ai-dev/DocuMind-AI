namespace DocuMind.Services.Interfaces
{
    using Microsoft.AspNetCore.Http;
    public interface IAIService
    {
        Task<string> UploadDocument(IFormFile file, string userId);
        Task<string> AskAI(string query, string documentId, string userId);
    }
}
