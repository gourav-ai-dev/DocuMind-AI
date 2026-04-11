namespace DocuMind.Tests.Services
{
    using DocuMind.Common.DTOs;
    using DocuMind.Domain.Entities;
    using DocuMind.Infrastructure.Interfaces;
    using DocuMind.Services.Services;
    using FluentAssertions;
    using Moq;
    using Xunit;

    public class DocumentServiceTests
    {
        private readonly Mock<IDocumentRepository> _repoMock;
        private readonly DocumentService _service;

        public DocumentServiceTests()
        {
            _repoMock = new Mock<IDocumentRepository>();
            _service = new DocumentService(_repoMock.Object);
        }

        [Fact]
        public async Task GetAllUserDocumentsAsync_ShouldReturnDocuments()
        {
            // Arrange
            var userId = Guid.NewGuid().ToString();

            var docs = new List<DocumentDto>
            {
                new DocumentDto { Id = Guid.NewGuid(), FileName = "file1.pdf" }
            };

            _repoMock
                .Setup(x => x.GetAllUserDocumentsAsync(userId))
                .ReturnsAsync(docs);

            // Act
            var result = await _service.GetAllUserDocumentsAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetAllUserDocumentsAsync_ShouldCallRepository()
        {
            var userId = "123";

            _repoMock
                .Setup(x => x.GetAllUserDocumentsAsync(userId))
                .ReturnsAsync(new List<DocumentDto>());

            await _service.GetAllUserDocumentsAsync(userId);

            _repoMock.Verify(x => x.GetAllUserDocumentsAsync(userId), Times.Once);
        }

        [Fact]
        public async Task DeleteUserDocumentAsync_ShouldReturnTrue_WhenDeleted()
        {
            var userId = Guid.NewGuid().ToString();
            var docId = Guid.NewGuid();

            _repoMock
                .Setup(x => x.DeleteUserDocumentAsync(userId, docId))
                .ReturnsAsync(true);

            var result = await _service.DeleteUserDocumentAsync(userId, docId);

            result.Should().BeTrue();
        }


        [Fact]
        public async Task DeleteUserDocumentAsync_ShouldReturnFalse_WhenNotFound()
        {
            var userId = Guid.NewGuid().ToString();
            var docId = Guid.NewGuid();

            _repoMock
                .Setup(x => x.DeleteUserDocumentAsync(userId, docId))
                .ReturnsAsync(false);

            var result = await _service.DeleteUserDocumentAsync(userId, docId);

            result.Should().BeFalse();
        }

        [Fact]
        public async Task GetDocumentChatHistory_ShouldReturnChats()
        {
            var userId = Guid.NewGuid().ToString();
            var docId = Guid.NewGuid().ToString();

            var chats = new List<ChatHistory>
            {
                new ChatHistory 
                { 
                    Id = Guid.NewGuid() 
                }
            };

            _repoMock
                .Setup(x => x.GetDocumentChatHistory(userId, docId))
                .ReturnsAsync(chats);

            var result = await _service.GetDocumentChatHistory(userId, docId);

            result.Should().HaveCount(1);
        }
    }
}
