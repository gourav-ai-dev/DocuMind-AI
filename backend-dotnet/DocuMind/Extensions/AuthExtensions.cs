namespace DocuMind.API.Extensions
{
    using DocuMind.Common.Options;
    using DocuMind.Services.Interfaces;
    using DocuMind.Services.Services;
    using Microsoft.AspNetCore.Authentication.JwtBearer;
    using Microsoft.IdentityModel.Tokens;
    using System.Text;

    public static class AuthExtensions
    {
        public static IServiceCollection AddJwtAuth(this IServiceCollection services, IConfiguration config)
        {
            services.Configure<JwtOptions>(config.GetSection("Jwt"));
            services.AddScoped<IJwtService, JwtService>();

            var key = Encoding.UTF8.GetBytes(config["Jwt:Key"]);

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidIssuer = config["Jwt:Issuer"],
                        ValidAudience = config["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(key)
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            context.Token = context.Request.Cookies["accessToken"];
                            return Task.CompletedTask;
                        }
                    };
                });

            return services;
        }
    }
}
