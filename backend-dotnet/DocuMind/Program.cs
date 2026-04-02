using DocuMind.API.Helper;
using DocuMind.API.Models;
using DocuMind.API.Services;
using DocuMind.Domain.Entities;
using DocuMind.Infrastructure;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddScoped<JwtService>();
builder.Services.AddHttpClient<AIService>();

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
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));


app.MapPost("/api/auth/register", async (RegisterRequest request, DocuMindDbContext db) =>
{
    // Check if user exists
    var existingUser = db.Users.FirstOrDefault(x => x.Email == request.Email);

    if (existingUser != null)
        return Results.BadRequest("User already exists");

    var user = new User
    {
        Id = Guid.NewGuid(),
        Email = request.Email,
        PasswordHash = PasswordHelper.HashPassword(request.Password),
        CreatedAt = DateTime.UtcNow
    };

    db.Users.Add(user);
    await db.SaveChangesAsync();

    return Results.Ok("User registered successfully");
});

app.MapPost("/api/auth/login", async (
    LoginRequest request,
    DocuMindDbContext db,
    JwtService jwtService) =>
{
    var user = db.Users.FirstOrDefault(x => x.Email == request.Email);

    if (user == null)
        return Results.BadRequest("Invalid credentials");

    var hashed = PasswordHelper.HashPassword(request.Password);

    if (user.PasswordHash != hashed)
        return Results.BadRequest("Invalid credentials");

    var token = jwtService.GenerateToken(user);

    return Results.Ok(new
    {
        token = token,
        userId = user.Id
    });
});

app.MapGet("/api/test/user", (HttpContext httpContext) =>
{
    var userId = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    return Results.Ok(new
    {
        userId = userId
    });
}).RequireAuthorization();

app.MapPost("/api/document/upload", async (
    HttpContext httpContext,
    AIService aiService) =>
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

app.MapPost("/api/ai/query", async (
    HttpContext httpContext,
    AIService aiService,
    QueryRequest request) =>
{
    var userId = httpContext.User
        .FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    var result = await aiService.AskAI(request.Query, userId);

    return Results.Content(result, "application/json");
}).RequireAuthorization();

app.Run();
