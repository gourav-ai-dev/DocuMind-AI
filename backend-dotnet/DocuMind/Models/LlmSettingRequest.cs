namespace DocuMind.API.Models
{
    using DocuMind.Common.Options;

    public class LlmSettingRequest
    {
        public string UserId { get; set; }
        public string Query { get; set; }

        public AISettings? Config { get; set; }
    }
}
