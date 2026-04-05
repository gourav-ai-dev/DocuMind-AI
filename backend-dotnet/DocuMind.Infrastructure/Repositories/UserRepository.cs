namespace DocuMind.Infrastructure.Repositories
{
    using DocuMind.Domain.Entities;
    using DocuMind.Infrastructure.Interfaces;
    using Microsoft.EntityFrameworkCore;

    public class UserRepository : IUserRepository
    {
        private readonly DocuMindDbContext _db;

        public UserRepository(DocuMindDbContext db)
        {
            _db = db;
        }

        public Task<User?> GetByEmailAsync(string email)
        {
            return _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task RegisterUserAsync(User request)
        {
           _db.Users.Add(request);
            await _db.SaveChangesAsync();
        }
    }
}
