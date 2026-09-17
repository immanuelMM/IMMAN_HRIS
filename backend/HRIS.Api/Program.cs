using System.Text;
using HRIS.Api.Data;
using HRIS.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// Container platforms commonly inject PORT and expect the app to bind to it.
// Only override the URL when it's actually set, so local dev (`dotnet run --urls ...`)
// and launchSettings.json keep working as normal.
var containerPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(containerPort))
{
    builder.WebHost.UseUrls($"http://+:{containerPort}");
}

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter 'Bearer {token}'",
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" },
            },
            Array.Empty<string>()
        },
    });
});

var connectionString = ResolvePostgresConnectionString(builder.Configuration, builder.Environment);
builder.Services.AddDbContext<HrisDbContext>(options => options.UseNpgsql(connectionString));

builder.Services.AddScoped<CredentialGenerator>();
builder.Services.AddSingleton<CredentialHasher>();
builder.Services.AddSingleton<JwtTokenService>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var jwtSection = builder.Configuration.GetSection("Jwt");
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtSection["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSection["Audience"],
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"]!)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(1),
    };
});

builder.Services.AddAuthorization();

var allowedOrigin = builder.Configuration["Cors:AllowedOrigin"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseHttpsRedirection();
}

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Serve the built React app (present in the container image; absent in local dev,
// where Vite serves the frontend separately) with client-side routing fallback.
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HrisDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<CredentialHasher>();
    await SeedData.SeedAsync(db, hasher);
}

app.Run();

// Render (and Heroku-style platforms) hand Postgres connection info as a single
// "postgres://user:pass@host:port/db" URL via DATABASE_URL, but Npgsql wants a
// key=value connection string. Support both, plus a local appsettings fallback.
static string ResolvePostgresConnectionString(IConfiguration configuration, IHostEnvironment environment)
{
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

    if (!string.IsNullOrEmpty(databaseUrl))
    {
        if (databaseUrl.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
            || databaseUrl.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            var uri = new Uri(databaseUrl);
            var userInfo = uri.UserInfo.Split(':', 2);

            var builder = new NpgsqlConnectionStringBuilder
            {
                Host = uri.Host,
                Port = uri.Port > 0 ? uri.Port : 5432,
                Database = uri.AbsolutePath.TrimStart('/'),
                Username = Uri.UnescapeDataString(userInfo[0]),
                Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : null,
                SslMode = SslMode.Prefer,
            };
            return builder.ConnectionString;
        }

        // Already a plain Npgsql key=value connection string.
        return databaseUrl;
    }

    // Running in a container (PORT is set by the platform) with no DATABASE_URL means
    // we're about to fall back to the local-dev default, which points at localhost and
    // cannot possibly work there. Fail immediately with a clear message instead of
    // letting Npgsql throw a cryptic "connection refused" against 127.0.0.1 later.
    var isContainer = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PORT"));
    if (isContainer || environment.IsProduction())
    {
        throw new InvalidOperationException(
            "DATABASE_URL is not set. This app needs a PostgreSQL database — create one on your hosting " +
            "platform (e.g. a Render PostgreSQL instance) and set the DATABASE_URL environment variable on " +
            "this service to its connection string (Render calls this the 'Internal Database URL').");
    }

    return configuration.GetConnectionString("Default")
        ?? throw new InvalidOperationException(
            "No database connection string configured. Set the DATABASE_URL environment variable " +
            "or ConnectionStrings:Default in appsettings.");
}
