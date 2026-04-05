namespace DocuMind.Infrastructure.Interfaces
{
    using DocuMind.Common.DTOs;

    public interface IDocumentRepository
    {
        Task<List<DocumentDto>> GetAllUserDocumentsAsync(string userId);
        Task<bool> DeleteUserDocumentAsync(string userId, Guid documentId);
    }
}
