namespace DocuMind.Domain.Entities
{
    public class User
    {
        public Guid Id { get; set; }

        public string Email { get; set; }

        public string PasswordHash { get; set; }

        public DateTime CreatedAt { get; set; }

        public ICollection<ChatHistory> ChatHistories { get; set; }

        public ICollection<Document> Documents { get; set; }
    }
}