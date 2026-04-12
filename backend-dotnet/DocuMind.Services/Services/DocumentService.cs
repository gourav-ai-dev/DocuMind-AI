namespace DocuMind.Services.Services
{
    using DocuMind.Common.DTOs;
    using DocuMind.Domain.Entities;
    using DocuMind.Infrastructure.External.Interfaces;
    using DocuMind.Infrastructure.Interfaces;
    using DocuMind.Services.Interfaces;
    using Microsoft.AspNetCore.Http;

    public class DocumentService : IDocumentService
    {
        private readonly IDocumentRepository _repository;
        private readonly IAiService _aiService;

        public DocumentService(IDocumentRepository repository, IAiService aiService)
        {
            _repository = repository;
            _aiService = aiService;
        }

        public async Task<List<DocumentDto>> GetAllUserDocumentsAsync(string userId)
        {
           return await _repository.GetAllUserDocumentsAsync(userId);
        }

        public async Task<bool> DeleteUserDocumentAsync(string userId, Guid documentId)
        {
            return await _repository.DeleteUserDocumentAsync(userId, documentId);
        }

        public async Task<List<ChatHistory>> GetDocumentChatHistory(string userId, string documentId)
        {
           return await _repository.GetDocumentChatHistory(userId, documentId);
        }

        public Task<string> UploadDocument(IFormFile file, string userId)
        {
            return _aiService.UploadDocument(file, userId);
        }
    }
}
