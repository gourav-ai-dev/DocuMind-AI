namespace DocuMind.Services.Interfaces
{
    using DocuMind.Common.DTOs;

    public interface IUserService
    {
        Task<bool> RegisterUserAsync(RegisterRequest request);

        Task<LoginResponse?> LoginAsync(LoginRequest request);

    }
}
