namespace DocuMind.Domain.Entities
{
    public class Chunk
    {
        public Guid Id { get; set; }
        public Guid DocumentId { get; set; }
        public string Content { get; set; }
        public string Embedding { get; set; }

        public Document Document { get; set; }
    }
}