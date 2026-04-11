using System;
using System.Collections.Generic;
using System.Text;

namespace DocuMind.Tests.Services
{
    using Xunit;
    using Moq;
    using FluentAssertions;

    using DocuMind.Services.Services;
    using DocuMind.Services.Helpers;
    using DocuMind.Infrastructure.Interfaces;
    using DocuMind.Services.Interfaces;
    using DocuMind.Common.DTOs;
    using DocuMind.Domain.Entities;

    public class UserServiceTests
    {
        private readonly Mock<IUserRepository> _repoMock;
        private readonly Mock<IJwtService> _jwtMock;
        private readonly UserService _service;

        public UserServiceTests()
        {
            _repoMock = new Mock<IUserRepository>();
            _jwtMock = new Mock<IJwtService>();

            _service = new UserService(_repoMock.Object, _jwtMock.Object);
        }

        [Fact]
        public async Task RegisterUserAsync_ShouldReturnTrue_WhenUserDoesNotExist()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = "test@gmail.com",
                Password = "123456"
            };

            _repoMock
                .Setup(x => x.GetByEmailAsync(request.Email))
                .ReturnsAsync((User?)null);

            _repoMock
                .Setup(x => x.RegisterUserAsync(It.IsAny<User>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.RegisterUserAsync(request);

            // Assert
            result.Should().BeTrue();

            _repoMock.Verify(x => x.RegisterUserAsync(It.IsAny<User>()), Times.Once);
        }

        [Fact]
        public async Task RegisterUserAsync_ShouldReturnFalse_WhenUserExists()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = "test@gmail.com"
            };

            _repoMock
                .Setup(x => x.GetByEmailAsync(request.Email))
                .ReturnsAsync(new User()); // user exists

            // Act
            var result = await _service.RegisterUserAsync(request);

            // Assert
            result.Should().BeFalse();

            _repoMock.Verify(x => x.RegisterUserAsync(It.IsAny<User>()), Times.Never);
        }

        [Fact]
        public async Task LoginAsync_ShouldReturnResponse_WhenCredentialsValid()
        {
            // Arrange
            var request = new LoginRequest
            {
                Email = "test@gmail.com",
                Password = "123456"
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                PasswordHash = PasswordHelper.HashPassword(request.Password)
            };

            _repoMock
                .Setup(x => x.GetByEmailAsync(request.Email))
                .ReturnsAsync(user);

            _jwtMock
                .Setup(x => x.GenerateToken(user))
                .ReturnsAsync("fake-token");

            // Act
            var result = await _service.LoginAsync(request);

            // Assert
            result.Should().NotBeNull();
            result!.UserId.Should().Be(user.Id);
        }

        [Fact]
        public async Task LoginAsync_ShouldReturnNull_WhenUserNotFound()
        {
            var request = new LoginRequest
            {
                Email = "test@gmail.com",
                Password = "123456"
            };

            _repoMock
                .Setup(x => x.GetByEmailAsync(request.Email))
                .ReturnsAsync((User?)null);

            var result = await _service.LoginAsync(request);

            result.Should().BeNull();
        }

        [Fact]
        public async Task LoginAsync_ShouldReturnNull_WhenPasswordIncorrect()
        {
            var request = new LoginRequest
            {
                Email = "test@gmail.com",
                Password = "wrong"
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                PasswordHash = PasswordHelper.HashPassword("correct-password")
            };

            _repoMock
                .Setup(x => x.GetByEmailAsync(request.Email))
                .ReturnsAsync(user);

            var result = await _service.LoginAsync(request);

            result.Should().BeNull();
        }
    }
}
