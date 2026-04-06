namespace DocuMind.Services.Services
{
    using DocuMind.Common.DTOs;
    using DocuMind.Domain.Entities;
    using DocuMind.Infrastructure.Interfaces;
    using DocuMind.Services.Interfaces;

    public class DocumentService : IDocumentService
    {
        private readonly IDocumentRepository _repository;
        public DocumentService(IDocumentRepository repository)
        {
            _repository = repository;
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
    }
}
