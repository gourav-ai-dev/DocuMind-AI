namespace DocuMind.Services.Services
{
    using DocuMind.Common.DTOs;
    using DocuMind.Domain.Entities;
    using DocuMind.Infrastructure.Interfaces;
    using DocuMind.Services.Helpers;
    using DocuMind.Services.Interfaces;

    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IJwtService _jwtService;


        public UserService(IUserRepository userRepository, IJwtService jwtService)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
        }

        public async Task<bool> RegisterUserAsync(RegisterRequest request)
        {
            var existingUser = await _userRepository.GetByEmailAsync(request.Email);

            if (existingUser != null)
                return false;

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                PasswordHash = PasswordHelper.HashPassword(request.Password),
                CreatedAt = DateTime.UtcNow
            };

            await _userRepository.RegisterUserAsync(user);
            return true;
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user == null) return null;

            var hashed = PasswordHelper.HashPassword(request.Password);
            if (user.PasswordHash != hashed) return null;

            var token = await _jwtService.GenerateToken(user);

            return new LoginResponse
            {
                UserId = user.Id,
                Token = token
            };
        }
    }
}
