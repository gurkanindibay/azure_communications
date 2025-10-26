# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["SimpleChat.API/SimpleChat.API.csproj", "SimpleChat.API/"]
COPY ["SimpleChat.Application/SimpleChat.Application.csproj", "SimpleChat.Application/"]
COPY ["SimpleChat.Infrastructure/SimpleChat.Infrastructure.csproj", "SimpleChat.Infrastructure/"]
COPY ["SimpleChat.Core/SimpleChat.Core.csproj", "SimpleChat.Core/"]

# Restore dependencies
RUN dotnet restore "SimpleChat.API/SimpleChat.API.csproj"

# Copy all files
COPY . .

# Build the application
WORKDIR "/src/SimpleChat.API"
RUN dotnet build "SimpleChat.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "SimpleChat.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
EXPOSE 8081
EXPOSE 443

# Copy published application
COPY --from=publish /app/publish .

# Set environment variables for production (default to HTTP; entrypoint will enable HTTPS if certificate provided)
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Install curl and jq so the container can call IMDS and Key Vault
RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl jq ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# Add an entrypoint that will retrieve a PFX from Key Vault using the
# assigned managed identity (IMDS), write it to /var/ssl/cert.pfx, then export
# the Kestrel certificate env vars
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
