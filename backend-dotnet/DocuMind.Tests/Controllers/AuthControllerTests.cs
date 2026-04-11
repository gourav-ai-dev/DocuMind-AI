namespace DocuMind.Tests.Controllers
{
    using DocuMind.API.Controllers;
    using DocuMind.Common.DTOs;
    using DocuMind.Services.Interfaces;
    using FluentAssertions;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Mvc;
    using Moq;
    using Xunit;

    public class AuthControllerTests
    {
        private readonly Mock<IUserService> _userServiceMock;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            _userServiceMock = new Mock<IUserService>();
            _controller = new AuthController(_userServiceMock.Object);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
        }

        [Fact]
        public async Task Register_ShouldReturnOk_WhenUserIsCreated()
        {
            // Arrange
            var request = new RegisterRequest();

            _userServiceMock
                .Setup(x => x.RegisterUserAsync(request))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.Register(request);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task Register_ShouldReturnBadRequest_WhenUserExists()
        {
            // Arrange
            var request = new RegisterRequest();

            _userServiceMock
                .Setup(x => x.RegisterUserAsync(request))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.Register(request);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task Login_ShouldReturnOk_WhenCredentialsAreValid()
        {
            // Arrange
            var request = new LoginRequest()
            {
                Email = "test@gmail,com",
                Password="123456"
            };

            var loginResponse = new LoginResponse
            {
                UserId = Guid.NewGuid(),
                Token = "fake-token"
            };

            _userServiceMock
                .Setup(x => x.LoginAsync(request))
                .ReturnsAsync(loginResponse);

            // Act
            var result = await _controller.Login(request);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().NotBeNull();
        }

        [Fact]
        public async Task Login_ShouldReturnBadRequest_WhenCredentialsAreInvalid()
        {
            // Arrange
            var request = new LoginRequest();

            _userServiceMock
                .Setup(x => x.LoginAsync(request))
                .ReturnsAsync((LoginResponse)null);

            // Act
            var result = await _controller.Login(request);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
        }
    }
}
