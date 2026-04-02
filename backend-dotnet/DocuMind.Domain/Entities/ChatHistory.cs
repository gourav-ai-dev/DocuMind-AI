namespace DocuMind.Domain.Entities
{
    public class ChatHistory
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Question { get; set; }
        public string Answer { get; set; }
        public DateTime CreatedAt { get; set; }

        public User User { get; set; }
    }
}