namespace DocuMind.Infrastructure.External.Services
{
    using DocuMind.Infrastructure.External.Interfaces;
    using Microsoft.AspNetCore.Http;
    using System.Text;
    using System.Text.Json;

    public class OllamaService : IAiService
    {
        private readonly HttpClient _httpClient;

        public OllamaService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<string> UploadDocument(IFormFile file, string userId)
        {
            using var content = new MultipartFormDataContent();

            var fileStream = file.OpenReadStream();

            content.Add(new StreamContent(fileStream), "file", file.FileName);
            content.Add(new StringContent(userId), "userId");

            var response = await _httpClient.PostAsync("http://127.0.0.1:8000/api/upload", content);

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> AskAI(string query, string documentId, string userId)
        {
            var payload = new
            {
                query = query,
                documentId = documentId,
                userId = userId
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync("http://localhost:8000/api/query", content);

            var result = await response.Content.ReadAsStringAsync();

            return result;
        }
    }
}
