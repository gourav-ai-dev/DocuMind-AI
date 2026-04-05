namespace DocuMind.Services.Interfaces
{
    using DocuMind.Common.DTOs;

    public interface IDocumentService
    {
        Task<List<DocumentDto>> GetAllUserDocumentsAsync(string userId);
        Task<bool> DeleteUserDocumentAsync(string userId, Guid documentId);
    }
}
