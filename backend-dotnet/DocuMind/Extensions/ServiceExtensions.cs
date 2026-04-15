namespace DocuMind.API.Extensions
{
    using DocuMind.Infrastructure.External.Interfaces;
    using DocuMind.Infrastructure.External.Services;
    using DocuMind.Infrastructure.Interfaces;
    using DocuMind.Infrastructure.Repositories;
    using DocuMind.Services.Interfaces;
    using DocuMind.Services.Services;

    public static class ServiceExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IUserService, UserService>();

            services.AddScoped<IDocumentRepository, DocumentRepository>();
            services.AddScoped<IDocumentService, DocumentService>();

            services.AddScoped<IAIService, AIService>();
            services.AddHttpClient<IAiService, OllamaService>(client =>
            {
                client.Timeout = TimeSpan.FromMinutes(20);
            }); ;

            return services;
        }
    }
}
