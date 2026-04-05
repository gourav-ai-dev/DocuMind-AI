namespace DocuMind.Infrastructure.External.Interfaces
{
    using Microsoft.AspNetCore.Http;

    public interface IAiService
    {
        Task<string> UploadDocument(IFormFile file, string userId);
        Task<string> AskAI(string query, string userId);
    }
}
