namespace DocuMind.Services.Interfaces
{
    using DocuMind.Common.DTOs;
    using DocuMind.Domain.Entities;

    public interface IDocumentService
    {
        Task<List<DocumentDto>> GetAllUserDocumentsAsync(string userId);
        Task<bool> DeleteUserDocumentAsync(string userId, Guid documentId);

        Task<List<ChatHistory>> GetDocumentChatHistory(string userId, string documentId);
    }
}
