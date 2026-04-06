namespace DocuMind.Infrastructure.Repositories
{
    using DocuMind.Common.DTOs;
    using DocuMind.Domain.Entities;
    using DocuMind.Infrastructure.Interfaces;
    using Microsoft.EntityFrameworkCore;

    public class DocumentRepository : IDocumentRepository
    {
        private readonly DocuMindDbContext _context;

        public DocumentRepository(DocuMindDbContext context)
        {
            _context = context;
        }

        public async Task<List<DocumentDto>> GetAllUserDocumentsAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid))
                throw new ArgumentException("Invalid user ID format.", nameof(userId));

            return await _context.Documents
                .Where(doc => doc.UserId == userGuid)
                .OrderByDescending(doc => doc.CreatedAt)
                .Select(doc => new DocumentDto 
                {
                    Id = doc.Id,
                    FileName = doc.FileName
                })
                .ToListAsync();
        }

        public async Task<bool> DeleteUserDocumentAsync(string userId, Guid documentId)
        {
            if (!Guid.TryParse(userId, out var userGuid))
                throw new ArgumentException("Invalid user ID format.", nameof(userId));

            var doc = await _context.Documents
                .FirstOrDefaultAsync(d => d.Id == documentId && d.UserId == userGuid);

            if (doc == null) return false;

            var chats = _context.ChatHistories.Where(c => c.DocumentId == documentId);

            _context.ChatHistories.RemoveRange(chats);

            _context.Documents.Remove(doc);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<ChatHistory>> GetDocumentChatHistory(string userId, string documentId)
        {

            var chat  = await _context.ChatHistories
                .Where(x => x.UserId == Guid.Parse(userId) && x.DocumentId == Guid.Parse(documentId))
                .OrderBy(x =>x .CreatedAt).ToListAsync();

            return chat;
        }
    }
}
