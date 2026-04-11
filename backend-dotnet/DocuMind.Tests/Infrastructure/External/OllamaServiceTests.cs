namespace DocuMind.Tests.Infrastructure.External
{
    using DocuMind.Infrastructure.External.Services;
    using FluentAssertions;
    using Microsoft.AspNetCore.Http;
    using Moq;
    using System;
    using System.IO;
    using System.Net;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Xunit;

    public class OllamaServiceTests
    {
        private class TestHandler : HttpMessageHandler
        {
            private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder;

            public HttpRequestMessage LastRequest { get; private set; }

            public TestHandler(Func<HttpRequestMessage, HttpResponseMessage> responder)
            {
                _responder = responder;
            }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                LastRequest = request;
                var resp = _responder(request);
                return Task.FromResult(resp);
            }
        }

        [Fact]
        public async Task UploadDocument_ShouldPostMultipartAndReturnResponse()
        {
            // Arrange
            var expected = "upload-ok";

            var handler = new TestHandler(req =>
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(expected)
                };
            });

            var client = new HttpClient(handler);
            var service = new OllamaService(client);

            var fileMock = new Mock<IFormFile>();
            var contentBytes = Encoding.UTF8.GetBytes("dummy");
            fileMock.Setup(f => f.OpenReadStream()).Returns(new MemoryStream(contentBytes));
            fileMock.Setup(f => f.FileName).Returns("file.pdf");

            // Act
            var result = await service.UploadDocument(fileMock.Object, "user123");

            // Assert
            result.Should().Be(expected);
            handler.LastRequest.Should().NotBeNull();
            handler.LastRequest.Method.Should().Be(HttpMethod.Post);
            handler.LastRequest.RequestUri!.AbsoluteUri.Should().EndWith("/api/upload");
            handler.LastRequest.Content.Should().BeOfType<MultipartFormDataContent>();
        }

        [Fact]
        public async Task AskAI_ShouldPostJsonAndReturnResponse()
        {
            // Arrange
            var expected = "{\"answer\":\"ok\"}";

            var handler = new TestHandler(req =>
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(expected, Encoding.UTF8, "application/json")
                };
            });

            var client = new HttpClient(handler);
            var service = new OllamaService(client);

            // Act
            var result = await service.AskAI("hello", "doc1", "user123");

            // Assert
            result.Should().Be(expected);
            handler.LastRequest.Should().NotBeNull();
            handler.LastRequest.Method.Should().Be(HttpMethod.Post);
            handler.LastRequest.RequestUri!.AbsoluteUri.Should().EndWith("/api/query");
            handler.LastRequest.Content.Headers.ContentType.MediaType.Should().Be("application/json");

            var body = await handler.LastRequest.Content.ReadAsStringAsync();
            body.Should().Contain("\"query\":\"hello\"");
            body.Should().Contain("\"documentId\":\"doc1\"");
            body.Should().Contain("\"userId\":\"user123\"");
        }
    }
}
