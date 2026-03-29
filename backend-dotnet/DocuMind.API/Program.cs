using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var app = builder.Build();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.MapPost("/api/chat", async (HttpContext context) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var body = await reader.ReadToEndAsync();

    using var client = new HttpClient();

    var content = new StringContent(body, Encoding.UTF8, "application/json");

    var response = await client.PostAsync("http://localhost:8000/api/query", content);
    var result = await response.Content.ReadAsStringAsync();

    return Results.Content(result, "application/json");
});

app.MapPost("/api/upload", async (HttpRequest request) =>
{
    if (!request.HasFormContentType)
        return Results.BadRequest("Invalid form data");

    var form = await request.ReadFormAsync();
    var file = form.Files.FirstOrDefault();

    if (file == null)
        return Results.BadRequest("No file uploaded");

    using var stream = new MemoryStream();
    await file.CopyToAsync(stream);

    using var client = new HttpClient();

    var content = new MultipartFormDataContent();
    content.Add(new ByteArrayContent(stream.ToArray()), "file", file.FileName);

    var response = await client.PostAsync("http://localhost:8000/api/upload", content);
    var result = await response.Content.ReadAsStringAsync();

    return Results.Content(result, "application/json");
});

app.Run();
