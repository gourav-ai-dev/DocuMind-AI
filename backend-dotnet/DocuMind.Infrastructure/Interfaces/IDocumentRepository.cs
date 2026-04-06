namespace DocuMind.Infrastructure.Interfaces
{
    using DocuMind.Common.DTOs;
    using DocuMind.Domain.Entities;

    public interface IDocumentRepository
    {
        Task<List<DocumentDto>> GetAllUserDocumentsAsync(string userId);
        Task<bool> DeleteUserDocumentAsync(string userId, Guid documentId);

        Task<List<ChatHistory>> GetDocumentChatHistory(string userId, string documentId);
    }
}
