namespace DocuMind.API.Controllers
{
    using DocuMind.Common.DTOs;
    using DocuMind.Services.Interfaces;
    using Microsoft.AspNetCore.Mvc;

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;

        public AuthController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest request)
        {
            var success = await _userService.RegisterUserAsync(request);

            return success
                ? Ok("User registered successfully")
                : BadRequest("User already exists");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var loginResult = await _userService.LoginAsync(request);

            if (loginResult == null)
                return BadRequest("Invalid credentials");

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddHours(2)
            };

            Response.Cookies.Append("accessToken", loginResult.Token, cookieOptions);

            return Ok(new
            {
                userId = loginResult.UserId
            });
        }
    }
}
