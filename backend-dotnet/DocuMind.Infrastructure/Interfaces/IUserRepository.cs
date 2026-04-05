namespace DocuMind.Infrastructure.Interfaces
{
    using DocuMind.Domain.Entities;

    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email);
        Task RegisterUserAsync(User request);
    }
}
