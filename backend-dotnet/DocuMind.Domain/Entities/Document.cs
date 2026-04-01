namespace DocuMind.Domain.Entities
{
    public class Document
    {
        public Guid Id { get; set; }
        public string FileName { get; set; }
        public DateTime CreatedAt { get; set; }

        public List<Chunk> Chunks { get; set; }
    }
}