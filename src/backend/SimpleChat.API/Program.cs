using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;
using SimpleChat.Application.Interfaces;
using SimpleChat.Application.Services;
using SimpleChat.Core.Interfaces;
using SimpleChat.Infrastructure.Data;
using SimpleChat.Infrastructure.UnitOfWork;
using SimpleChat.Infrastructure.Services;
using AspNetCoreRateLimit;
using Serilog;
using System.IdentityModel.Tokens.Jwt;

    // Configure Serilog
    Log.Logger = new LoggerConfiguration()
        .WriteTo.Console()
        .WriteTo.File("logs/simplechat-.txt", rollingInterval: RollingInterval.Day)
        .CreateLogger();

    try
    {
        Log.Information("Starting SimpleChat API");

        var builder = WebApplication.CreateBuilder(args);

        // Configure Serilog
        builder.Host.UseSerilog();    // Add Database Context
    builder.Services.AddDbContext<SimpleChatDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

    // Add Unit of Work
    builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

    // Add Application Services
    builder.Services.AddScoped<IUserService, UserService>();
    builder.Services.AddScoped<IChatService, ChatService>();
    builder.Services.AddScoped<IAuthService, AuthService>();

    // Add Infrastructure Services
    builder.Services.AddScoped<IAzureCommunicationService, AzureCommunicationService>();

    // Add AutoMapper
    builder.Services.AddAutoMapper(typeof(SimpleChat.Application.MappingProfile).Assembly);

    // Configure Rate Limiting
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
    builder.Services.Configure<IpRateLimitPolicies>(builder.Configuration.GetSection("IpRateLimitPolicies"));
    builder.Services.AddInMemoryRateLimiting();
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

    // Configure Authentication - Azure AD is required
    JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

    var tenantId = builder.Configuration["AzureAd:TenantId"];
    var clientId = builder.Configuration["AzureAd:ClientId"];

    if (string.IsNullOrEmpty(tenantId) || string.IsNullOrEmpty(clientId))
    {
        throw new InvalidOperationException(
            "Azure AD configuration is required. Please configure AzureAd:TenantId and AzureAd:ClientId in appsettings.json");
    }

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = $"https://login.microsoftonline.com/{tenantId}/v2.0";
            options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = false, // ID tokens don't have API audience
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                NameClaimType = "name",
                RoleClaimType = "roles"
            };

            options.Events = new JwtBearerEvents
            {
                // Removed SignalR-specific token handling as we're now using ACS
            };
        });

    // Add Authorization
    builder.Services.AddAuthorization();

    // Add CORS
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                ?? new[] { "http://localhost:5173" };
            
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    // Add Security Headers
    builder.Services.AddHsts(options =>
    {
        options.MaxAge = TimeSpan.FromDays(365);
        options.IncludeSubDomains = true;
        options.Preload = true;
    });

    // Add Controllers
    builder.Services.AddControllers();

    // Add services to the container.
    // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    var app = builder.Build();

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }
    else
    {
        app.UseHsts();
    }

    // Security Headers Middleware
    app.Use(async (context, next) =>
    {
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "DENY";
        context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        context.Response.Headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';";
        await next();
    });

    app.UseHttpsRedirection();

    // Use Rate Limiting
    app.UseIpRateLimiting();

    app.UseCors("AllowFrontend");

    app.UseAuthentication();
    app.UseAuthorization();

    // Request Logging
    app.UseSerilogRequestLogging();

    app.MapControllers();

    // Health check endpoint
    app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
        .WithName("HealthCheck")
        .WithOpenApi()
        .AllowAnonymous();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
