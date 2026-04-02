namespace DocuMind.Infrastructure
{
    using DocuMind.Domain.Entities;
    using Microsoft.EntityFrameworkCore;
    using System.Reflection.Metadata;

    public class DocuMindDbContext : DbContext
    {
        public DocuMindDbContext(DbContextOptions<DocuMindDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ChatHistory>()
                .HasOne(ch => ch.User)
                .WithMany(u => u.ChatHistories)
                .HasForeignKey(ch => ch.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Domain.Entities.Document>()
                .HasOne(d => d.User)
                .WithMany(u => u.Documents)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }

        public DbSet<Domain.Entities.Document> Documents { get; set; }
        public DbSet<Chunk> Chunks { get; set; }
        public DbSet<ChatHistory> ChatHistories { get; set; }
        public DbSet<User> Users { get; set; }
    }
}