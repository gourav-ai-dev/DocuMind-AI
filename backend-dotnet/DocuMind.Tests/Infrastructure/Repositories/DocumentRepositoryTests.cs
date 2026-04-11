namespace DocuMind.Tests.Infrastructure.Repositories
{
    using DocuMind.Domain.Entities;
    using DocuMind.Infrastructure;
    using DocuMind.Infrastructure.Repositories;
    using FluentAssertions;
    using Microsoft.EntityFrameworkCore;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using Xunit;

    public class DocumentRepositoryTests
    {
        private static DocuMindDbContext CreateContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<DocuMindDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;

            return new DocuMindDbContext(options);
        }

        [Fact]
        public async Task GetAllUserDocumentsAsync_ShouldReturnDocuments()
        {
            var dbName = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            using (var context = CreateContext(dbName))
            {
                context.Documents.AddRange(new List<Document>
                {
                    new Document { Id = Guid.NewGuid(), UserId = userId, FileName = "a.pdf", CreatedAt = DateTime.UtcNow.AddHours(-1) },
                    new Document { Id = Guid.NewGuid(), UserId = userId, FileName = "b.pdf", CreatedAt = DateTime.UtcNow }
                });

                await context.SaveChangesAsync();
            }

            using (var context = CreateContext(dbName))
            {
                var repo = new DocumentRepository(context);
                var result = await repo.GetAllUserDocumentsAsync(userId.ToString());

                result.Should().NotBeNull();
                result.Should().HaveCount(2);
                // ensure ordering by CreatedAt desc
                result.Select(r => r.FileName).Should().ContainInOrder("b.pdf", "a.pdf");
            }
        }

        [Fact]
        public async Task DeleteUserDocumentAsync_ShouldRemoveDocumentAndChats()
        {
            var dbName = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();
            var docId = Guid.NewGuid();

            using (var context = CreateContext(dbName))
            {
                context.Documents.Add(new Document { Id = docId, UserId = userId, FileName = "file.pdf", CreatedAt = DateTime.UtcNow });
                context.ChatHistories.Add(new ChatHistory { Id = Guid.NewGuid(), UserId = userId, DocumentId = docId, Question = "q", Answer = "a", CreatedAt = DateTime.UtcNow });
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext(dbName))
            {
                var repo = new DocumentRepository(context);
                var deleted = await repo.DeleteUserDocumentAsync(userId.ToString(), docId);

                deleted.Should().BeTrue();
                context.Documents.Find(docId).Should().BeNull();
                context.ChatHistories.Where(c => c.DocumentId == docId).Should().BeEmpty();
            }
        }

        [Fact]
        public async Task DeleteUserDocumentAsync_ShouldReturnFalse_WhenNotFound()
        {
            var dbName = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            using (var context = CreateContext(dbName))
            {
                var repo = new DocumentRepository(context);
                var result = await repo.DeleteUserDocumentAsync(userId.ToString(), Guid.NewGuid());
                result.Should().BeFalse();
            }
        }

        [Fact]
        public async Task GetDocumentChatHistory_ShouldReturnChatsInOrder()
        {
            var dbName = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();
            var docId = Guid.NewGuid();

            using (var context = CreateContext(dbName))
            {
                context.ChatHistories.AddRange(new List<ChatHistory>
                {
                    new ChatHistory { Id = Guid.NewGuid(), UserId = userId, DocumentId = docId, Question = "q1", Answer = "a1", CreatedAt = DateTime.UtcNow.AddMinutes(-10) },
                    new ChatHistory { Id = Guid.NewGuid(), UserId = userId, DocumentId = docId, Question = "q2", Answer = "a2", CreatedAt = DateTime.UtcNow }
                });

                await context.SaveChangesAsync();
            }

            using (var context = CreateContext(dbName))
            {
                var repo = new DocumentRepository(context);
                var chats = await repo.GetDocumentChatHistory(userId.ToString(), docId.ToString());

                chats.Should().HaveCount(2);
                chats.Select(c => c.Question).Should().ContainInOrder("q1", "q2");
            }
        }
    }
}
