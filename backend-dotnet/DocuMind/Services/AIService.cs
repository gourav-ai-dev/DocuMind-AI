namespace DocuMind.API.Services
{
    using System.Text;
    using System.Text.Json;

    public class AIService
    {
        private readonly HttpClient _httpClient;

        public AIService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<string> UploadDocument(IFormFile file, string userId)
        {
            using var content = new MultipartFormDataContent();

            var fileStream = file.OpenReadStream();

            content.Add(new StreamContent(fileStream), "file", file.FileName);
            content.Add(new StringContent(userId), "userId");

            var response = await _httpClient.PostAsync(
                "http://localhost:8000/api/upload",
                content
            );

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> AskAI(string query, string userId)
        {
            var payload = new
            {
                query = query,
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
