namespace DocuMind.Tests.Controllers
{
    using DocuMind.API.Controllers;
    using DocuMind.API.Models;
    using DocuMind.Services.Interfaces;
    using FluentAssertions;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Mvc;
    using Moq;
    using System.Security.Claims;
    using System.Text;
    using Xunit;

    public class AIControllerTests
    {
        private readonly Mock<IAIService> _aiServiceMock;
        private readonly AIController _controller;

        public AIControllerTests()
        {
            _aiServiceMock = new Mock<IAIService>();
            _controller = new AIController(_aiServiceMock.Object);
        }

        private void SetUser(string userId)
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId)
            }, "mock"));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = user
                }
            };
        }

        [Fact]
        public async Task Query_ShouldReturnContent_WhenValidRequest()
        {
            // Arrange
            var userId = "123";
            SetUser(userId);

            var request = new QueryRequest
            {
                Query = "What is AI?",
                DocumentId = "doc1"
            };

            _aiServiceMock
                .Setup(x => x.AskAI(request.Query, request.DocumentId, userId))
                .ReturnsAsync("{\"answer\":\"AI response\"}");

            // Act
            var result = await _controller.Query(request);

            // Assert
            var contentResult = result.Should().BeOfType<ContentResult>().Subject;
            contentResult.Content.Should().Contain("AI response");
        }
    }
}
