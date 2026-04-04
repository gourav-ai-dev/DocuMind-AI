namespace DocuMind.API.Models
{
    public class AISettings
    {
        public string EmbeddingUrl { get; set; } = "http://localhost:11434/api/embeddings";
        public string EmbeddingModel { get; set; } = "nomic-embed-text";

        public string LlmUrl { get; set; } = "http://localhost:11434/api/generate";
        public string LlmModel { get; set; } = "tinyllama";

        public int ChunkSize { get; set; } = 500;
        public int ChunkOverlap { get; set; } = 50;
    }
}
