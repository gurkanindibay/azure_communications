# Security Implementation

This document outlines the security measures implemented in the SimpleChat API.

## 🔐 Secret Management

### Never Commit Secrets

**❌ NEVER commit sensitive information to version control:**

- Azure Communication Services connection strings
- Azure AD client secrets
- Database passwords
- API keys and tokens

### Local Development

Choose one of these secure methods:

**User Secrets (Recommended):**
```bash
dotnet user-secrets set "AzureCommunicationServices:ConnectionString" "your_connection_string"
```

**Local Configuration File:**
```bash
cp appsettings.template.json appsettings.Local.json
# Edit appsettings.Local.json with your values (file is gitignored)
```

### Production

Use **Azure Key Vault** for production secrets:

1. Store secrets in Azure Key Vault
2. Configure application to read from Key Vault
3. Use Managed Identity for authentication

### Configuration Files

- `appsettings.json` - Base config with placeholders (committed)
- `appsettings.Development.json` - Development secrets (gitignored)
- `appsettings.Production.json` - Production config (gitignored)
- `appsettings.Local.json` - Local development config (gitignored)
- `appsettings.template.json` - Template for new developers (committed)

## 🔐 Authentication & Authorization

### Azure AD Integration
- **Provider**: Microsoft Entra ID (Azure AD)
- **Authentication Scheme**: JWT Bearer tokens
- **Implementation**: Microsoft.Identity.Web
- **Configuration**: 
  - Tenant ID and Client ID stored in Azure Key Vault
  - Token validation with proper name and role claims

### Authorization
- All API controllers protected with `[Authorize]` attribute
- SignalR Hub requires authentication
- Health check endpoint allows anonymous access for monitoring

## 🛡️ Security Features

### 1. Rate Limiting
**Package**: AspNetCoreRateLimit

**Configuration**:
- **Per second**: 10 requests
- **Per minute**: 100 requests
- **Per hour**: 1000 requests
- **HTTP Status on limit**: 429 (Too Many Requests)
- **Endpoint-specific**: Enabled

**Purpose**: Prevent abuse and DDoS attacks

### 2. Security Headers
All responses include the following security headers:

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevent MIME type sniffing |
| X-Frame-Options | DENY | Prevent clickjacking attacks |
| X-XSS-Protection | 1; mode=block | Enable XSS filtering |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer information |
| Content-Security-Policy | default-src 'self'; frame-ancestors 'none'; | Prevent XSS and code injection |

### 3. HTTPS Enforcement
- **HTTPS Redirection**: Enabled
- **HSTS (HTTP Strict Transport Security)**: 
  - Max-Age: 365 days
  - Include Subdomains: Yes
  - Preload: Yes

### 4. CORS (Cross-Origin Resource Sharing)
- **Policy Name**: AllowFrontend
- **Allowed Origins**: Configured per environment
  - Development: http://localhost:5173, http://localhost:3000
  - Production: Should be configured with actual domain
- **Credentials**: Allowed
- **Methods**: All
- **Headers**: All

### 5. Secrets Management
- **Azure Key Vault Integration**: All sensitive configuration stored securely
- **Managed Identities**: Use DefaultAzureCredential for authentication
- **Secrets Stored**:
  - Azure AD Tenant ID
  - Azure AD Client ID
  - Azure Communication Services Connection String

### 6. Logging & Monitoring
**Package**: Serilog

**Features**:
- **Console Logging**: Real-time monitoring
- **File Logging**: 
  - Daily rolling logs
  - Retention: 30 days
  - Location: `logs/simplechat-{date}.txt`
- **Request Logging**: All HTTP requests logged
- **Structured Logging**: JSON format for easy parsing
- **Log Levels**:
  - Application: Information
  - Microsoft: Warning
  - System: Warning

## 🔒 Data Protection

### Database Security
- **Connection String**: Stored in appsettings (development only)
- **Production**: Should use Azure Key Vault or Managed Identity
- **SQL Injection**: Protected by Entity Framework Core parameterized queries
- **Encryption**: Use TrustServerCertificate=True (development) / SSL certificates (production)

### SignalR Security
- **Authentication**: Required for all hub connections
- **Authorization**: User context available in hub methods
- **Transport**: Supports WebSockets with fallback to Server-Sent Events and Long Polling

## 📋 Security Checklist

### Development Environment
- ✅ Azure AD authentication configured
- ✅ Rate limiting enabled
- ✅ Security headers applied
- ✅ HTTPS redirection enabled
- ✅ Structured logging implemented
- ✅ Secrets stored in Azure Key Vault
- ✅ CORS configured for localhost

### Production Deployment
- [ ] Update CORS allowed origins with production domain
- [ ] Configure proper SSL/TLS certificates
- [ ] Enable HSTS preload
- [ ] Review and adjust rate limiting thresholds
- [ ] Configure Application Insights for monitoring
- [ ] Enable Azure AD Managed Identity
- [ ] Review and rotate secrets regularly
- [ ] Enable Azure DDoS Protection
- [ ] Configure Azure Front Door or Application Gateway
- [ ] Enable Azure Web Application Firewall (WAF)
- [ ] Set up alerts for security events
- [ ] Regular security audits and penetration testing

## 🚨 Security Best Practices

### API Keys & Secrets
1. **Never commit secrets** to source control
2. **Use Azure Key Vault** for all sensitive configuration
3. **Rotate secrets** regularly (at least every 90 days)
4. **Use Managed Identities** in Azure for authentication
5. **Monitor Key Vault access** logs

### Authentication
1. **Validate all JWT tokens** properly
2. **Use short-lived tokens** (recommended: 1 hour)
3. **Implement token refresh** mechanism
4. **Never store tokens** in localStorage (use httpOnly cookies or sessionStorage)
5. **Validate redirect URIs** in Azure AD

### Input Validation
1. **Validate all user input** on both client and server
2. **Use DTOs** for data transfer
3. **Sanitize user content** before storing
4. **Implement proper error handling** without exposing sensitive information

### Network Security
1. **Use HTTPS only** in production
2. **Configure proper CORS** policies
3. **Implement rate limiting** to prevent abuse
4. **Use Azure Private Link** for database connections (production)
5. **Enable DDoS protection** for public endpoints

## 📞 Security Incident Response

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. **Email**: gurkanindibay@gmail.com (replace with actual security contact)
3. **Include**: 
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

## 🔄 Regular Security Updates

### Weekly
- Review access logs
- Check for failed authentication attempts
- Monitor rate limiting hits

### Monthly
- Review and update dependencies
- Check for security patches
- Audit user access levels

### Quarterly
- Rotate secrets in Key Vault
- Security code review
- Penetration testing
- Update security documentation

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Microsoft Security Best Practices](https://docs.microsoft.com/en-us/security/)
- [Azure Security Documentation](https://docs.microsoft.com/en-us/azure/security/)
- [ASP.NET Core Security](https://docs.microsoft.com/en-us/aspnet/core/security/)
