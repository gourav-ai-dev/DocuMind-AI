namespace DocuMind.Services.Services
{
    using DocuMind.Infrastructure.External.Interfaces;
    using DocuMind.Services.Interfaces;
    using Microsoft.AspNetCore.Http;

    public class AIService: IAIService
    {
        private readonly IAiService _aiService;
        public AIService(IAiService aiService) 
        { 
           _aiService = aiService;
        }

        public Task<string> AskAI(string query, string documentId, string userId)
        {
            return _aiService.AskAI(query, documentId, userId);
        }
    }
}
