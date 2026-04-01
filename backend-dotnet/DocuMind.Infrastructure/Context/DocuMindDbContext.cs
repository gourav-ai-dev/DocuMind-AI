using DocuMind.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata;

namespace DocuMind.Infrastructure
{
    public class DocuMindDbContext : DbContext
    {
        public DocuMindDbContext(DbContextOptions<DocuMindDbContext> options)
            : base(options)
        {
        }

        public DbSet<Domain.Entities.Document> Documents { get; set; }
        public DbSet<Chunk> Chunks { get; set; }
        public DbSet<ChatHistory> ChatHistories { get; set; }
    }
}