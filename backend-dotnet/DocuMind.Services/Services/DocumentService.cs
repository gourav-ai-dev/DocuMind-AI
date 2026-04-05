namespace DocuMind.Services.Services
{
    using DocuMind.Common.DTOs;
    using DocuMind.Infrastructure.Interfaces;
    using DocuMind.Services.Interfaces;

    public class DocumentService : IDocumentService
    {
        private readonly IDocumentRepository _repository;
        public DocumentService(IDocumentRepository repository)
        {
            _repository = repository;
        }

        public Task<List<DocumentDto>> GetAllUserDocumentsAsync(string userId)
        {
           return _repository.GetAllUserDocumentsAsync(userId);
        }

        public Task<bool> DeleteUserDocumentAsync(string userId, Guid documentId)
        {
            return _repository.DeleteUserDocumentAsync(userId, documentId);
        }

    }
}
