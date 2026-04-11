namespace DocuMind.API.Extensions
{
    using DocuMind.Infrastructure;
    using Microsoft.EntityFrameworkCore;

    public static class DatabaseExtensions
    {
        public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration config)
        {
            services.AddDbContext<DocuMindDbContext>(options =>
                options.UseSqlServer(config.GetConnectionString("DefaultConnection")));

            return services;
        }
    }
}
