namespace DocuMind.Services.Interfaces
{
    using Microsoft.AspNetCore.Http;
    public interface IAIService
    {
        Task<string> AskAI(string query, string documentId, string userId);
    }
}
