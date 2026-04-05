using DocuMind.API.Models;
using DocuMind.Common.DTOs;
using DocuMind.Common.Options;
using DocuMind.Infrastructure;
using DocuMind.Infrastructure.External.Interfaces;
using DocuMind.Infrastructure.External.Services;
using DocuMind.Infrastructure.Interfaces;
using DocuMind.Infrastructure.Repositories;
using DocuMind.Services.Interfaces;
using DocuMind.Services.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

builder.Services.AddOpenApi();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddScoped<IJwtService, JwtService>();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddScoped<IAIService, AIService>();
builder.Services.AddHttpClient<IAiService, OllamaService>();

builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();
builder.Services.AddScoped<IDocumentService, DocumentService>();

builder.Services.AddDbContext<DocuMindDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]);

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(key)
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Cookies["accessToken"];
                context.Token = token;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));


app.MapPost("/api/auth/register", async (RegisterRequest request, IUserService userService) =>
{
    var success = await userService.RegisterUserAsync(request);
    return success ? Results.Ok("User registered successfully") : Results.BadRequest("User already exists");
});

app.MapPost("/api/auth/login", async (
    LoginRequest request,
    IUserService userService,
    HttpResponse response) =>
{
    var loginResult = await userService.LoginAsync(request);
    if (loginResult == null) return Results.BadRequest("Invalid credentials");

    var cookieOptions = new CookieOptions
    {
        HttpOnly = true,  
        Secure = true,
        SameSite = SameSiteMode.Strict,
        Expires = DateTime.UtcNow.AddHours(2)
    };

    response.Cookies.Append("accessToken", loginResult.Token, cookieOptions);

    return Results.Ok(new
    {
        userId = loginResult.UserId
    });
});

app.MapPost("/api/document/upload", async (
    HttpContext httpContext,
    IAIService aiService) =>
{
    var userId = httpContext.User
        .FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    var form = await httpContext.Request.ReadFormAsync();
    var file = form.Files.FirstOrDefault();

    if (file == null)
        return Results.BadRequest("No file uploaded");

    var result = await aiService.UploadDocument(file, userId);

    return Results.Ok(result);

}).RequireAuthorization();

app.MapGet("/api/documents", async (
    HttpContext httpContext,
    IDocumentService service) =>
{
    var userId = httpContext.User
        .FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;


    if (string.IsNullOrEmpty(userId))
        return Results.Unauthorized();

    var result = await service.GetAllUserDocumentsAsync(userId);

    return Results.Json(result);
}).RequireAuthorization();

app.MapDelete("/api/documents/{id:guid}", async (
    Guid id,
    HttpContext httpContext,
    IDocumentService service) =>
{
    var userId = httpContext.User
        .FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    if (string.IsNullOrEmpty(userId))
        return Results.Unauthorized();

    var success = await service.DeleteUserDocumentAsync(userId, id);

    return success ? Results.Ok() : Results.NotFound();
}).RequireAuthorization();


app.MapPost("/api/ai/query", async (
    HttpContext httpContext,
    IAIService aiService,
    QueryRequest request) =>
{
    var userId = httpContext.User
        .FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    var result = await aiService.AskAI(request.Query, userId);

    return Results.Content(result, "application/json");
}).RequireAuthorization();

app.Run();
