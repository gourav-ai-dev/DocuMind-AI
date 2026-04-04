namespace DocuMind.API.Models
{
    public class LlmSettingRequest
    {
        public string UserId { get; set; }
        public string Query { get; set; }

        public AISettings? Config { get; set; }
    }
}
