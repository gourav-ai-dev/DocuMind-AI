namespace DocuMind.Tests.Services
{
    using DocuMind.Common.Options;
    using DocuMind.Domain.Entities;
    using DocuMind.Services.Services;
    using FluentAssertions;
    using Microsoft.Extensions.Options;
    using Microsoft.IdentityModel.Tokens;
    using System;
    using System.IdentityModel.Tokens.Jwt;
    using System.Security.Claims;
    using System.Text;
    using System.Threading.Tasks;
    using Xunit;

    public class JwtServiceTests
    {
        [Fact]
        public async Task GenerateToken_ShouldReturnValidJwt()
        {
            // Arrange
            var opts = Options.Create(new JwtOptions
            {
                Key = "super-secret-key-which-is-long-enough",
                Issuer = "test-issuer",
                Audience = "test-audience",
                ExpiryMinutes = 60
            });

            var service = new JwtService(opts);

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "user@example.com"
            };

            // Act
            var token = await service.GenerateToken(user);

            // Assert
            token.Should().NotBeNullOrWhiteSpace();

            var handler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(opts.Value.Key);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = opts.Value.Issuer,
                ValidateAudience = true,
                ValidAudience = opts.Value.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            SecurityToken validatedToken;
            var principal = handler.ValidateToken(token, validationParameters, out validatedToken);

            principal.Should().NotBeNull();

            principal.FindFirst(ClaimTypes.NameIdentifier).Value.Should().Be(user.Id.ToString());
            principal.FindFirst(ClaimTypes.Email).Value.Should().Be(user.Email);

            validatedToken.Should().BeOfType<JwtSecurityToken>();
            ((JwtSecurityToken)validatedToken).ValidTo.Should().BeAfter(DateTime.UtcNow);
        }
    }
}
