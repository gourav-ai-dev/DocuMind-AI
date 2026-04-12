namespace DocuMind.Services.Interfaces
{
    using DocuMind.Common.DTOs;
    using DocuMind.Domain.Entities;
    using Microsoft.AspNetCore.Http;

    public interface IDocumentService
    {
        Task<List<DocumentDto>> GetAllUserDocumentsAsync(string userId);
        Task<bool> DeleteUserDocumentAsync(string userId, Guid documentId);
        Task<List<ChatHistory>> GetDocumentChatHistory(string userId, string documentId);
        Task<string> UploadDocument(IFormFile file, string userId);
    }
}
