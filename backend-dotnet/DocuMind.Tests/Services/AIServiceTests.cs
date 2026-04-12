namespace DocuMind.Tests.Services
{
    using System.Threading.Tasks;
    using Xunit;
    using Moq;
    using FluentAssertions;
    using Microsoft.AspNetCore.Http;

    using DocuMind.Infrastructure.External.Interfaces;
    using DocuMind.Services.Services;

    public class AIServiceTests
    {

        [Fact]
        public async Task AskAI_ShouldReturnResult_WhenCalled()
        {
            // Arrange
            var aiMock = new Mock<IAiService>();

            aiMock
                .Setup(x => x.AskAI("some query", "doc1", "user123"))
                .ReturnsAsync("{ \"answer\": \"ok\" }");

            var service = new AIService(aiMock.Object);

            // Act
            var result = await service.AskAI("some query", "doc1", "user123");

            // Assert
            result.Should().Be("{ \"answer\": \"ok\" }");
            aiMock.Verify(x => x.AskAI("some query", "doc1", "user123"), Times.Once);
        }
    }
}
