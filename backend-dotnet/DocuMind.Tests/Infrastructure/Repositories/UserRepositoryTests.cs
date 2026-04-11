namespace DocuMind.Tests.Infrastructure.Repositories
{
    using DocuMind.Domain.Entities;
    using DocuMind.Infrastructure;
    using DocuMind.Infrastructure.Repositories;
    using FluentAssertions;
    using Microsoft.EntityFrameworkCore;
    using System;
    using System.Threading.Tasks;
    using Xunit;

    public class UserRepositoryTests
    {
        private static DbContextOptions<DocuMindDbContext> CreateNewContextOptions()
        {
            return new DbContextOptionsBuilder<DocuMindDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
        }

        [Fact]
        public async Task RegisterUserAsync_ShouldAddUser()
        {
            var options = CreateNewContextOptions();

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@repo.com",
                PasswordHash = "hash",
                CreatedAt = DateTime.UtcNow
            };

            // Act
            using (var context = new DocuMindDbContext(options))
            {
                var repo = new UserRepository(context);
                await repo.RegisterUserAsync(user);
            }

            // Assert - new context to ensure data was saved
            using (var assertContext = new DocuMindDbContext(options))
            {
                var dbUser = await assertContext.Users.FirstOrDefaultAsync(u => u.Email == user.Email);
                dbUser.Should().NotBeNull();
                dbUser!.Id.Should().Be(user.Id);
            }
        }

        [Fact]
        public async Task GetByEmailAsync_ShouldReturnUser_WhenExists()
        {
            var options = CreateNewContextOptions();

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "exists@repo.com",
                PasswordHash = "hash",
                CreatedAt = DateTime.UtcNow
            };

            using (var context = new DocuMindDbContext(options))
            {
                context.Users.Add(user);
                await context.SaveChangesAsync();
            }

            using (var context = new DocuMindDbContext(options))
            {
                var repo = new UserRepository(context);
                var result = await repo.GetByEmailAsync(user.Email);
                result.Should().NotBeNull();
                result!.Email.Should().Be(user.Email);
            }
        }

        [Fact]
        public async Task GetByEmailAsync_ShouldReturnNull_WhenNotFound()
        {
            var options = CreateNewContextOptions();

            using (var context = new DocuMindDbContext(options))
            {
                var repo = new UserRepository(context);
                var result = await repo.GetByEmailAsync("noone@repo.com");
                result.Should().BeNull();
            }
        }
    }
}
