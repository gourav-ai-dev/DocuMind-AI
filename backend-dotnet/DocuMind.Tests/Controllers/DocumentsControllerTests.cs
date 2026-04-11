namespace DocuMind.Tests.Controllers
{
    using DocuMind.API.Controllers;
    using DocuMind.Common.DTOs;
    using DocuMind.Services.Interfaces;
    using FluentAssertions;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Mvc;
    using Moq;
    using System.Security.Claims;
    using Xunit;

    public class DocumentsControllerTests
    {
        private readonly Mock<IDocumentService> _serviceMock;
        private readonly DocumentsController _controller;

        public DocumentsControllerTests()
        {
            _serviceMock = new Mock<IDocumentService>();
            _controller = new DocumentsController(_serviceMock.Object);
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
        public async Task GetAll_ShouldReturnOk_WhenUserIsValid()
        {
            // Arrange
            var userId = "123";
            SetUser(userId);

            _serviceMock.Setup(x => x.GetAllUserDocumentsAsync(userId))
                .ReturnsAsync(new List<DocumentDto>());

            // Act
            var result = await _controller.GetAll();

            // Assert
            result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task GetAll_ShouldReturnUnauthorized_WhenUserIsMissing()
        {
            // Arrange
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext() // no user
            };

            // Act
            var result = await _controller.GetAll();

            // Assert
            result.Should().BeOfType<UnauthorizedResult>();
        }

        [Fact]
        public async Task Delete_ShouldReturnOk_WhenDeleteSuccessful()
        {
            // Arrange
            var userId = "123";
            var docId = Guid.NewGuid();

            SetUser(userId);

            _serviceMock
                .Setup(x => x.DeleteUserDocumentAsync(userId, docId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.Delete(docId);

            // Assert
            result.Should().BeOfType<OkResult>();
        }

        [Fact]
        public async Task Delete_ShouldReturnNotFound_WhenDeleteFails()
        {
            // Arrange
            var userId = "123";
            var docId = Guid.NewGuid();

            SetUser(userId);

            _serviceMock
                .Setup(x => x.DeleteUserDocumentAsync(userId, docId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.Delete(docId);

            // Assert
            result.Should().BeOfType<NotFoundResult>();
        }
    }
}
