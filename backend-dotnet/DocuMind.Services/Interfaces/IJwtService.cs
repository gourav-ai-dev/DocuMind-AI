namespace DocuMind.Services.Interfaces
{
    using DocuMind.Domain.Entities;

    public interface IJwtService
    {
        Task<string> GenerateToken(User user);
    }
}
