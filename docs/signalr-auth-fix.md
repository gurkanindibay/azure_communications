# SignalR Authentication Fix

## Problem
SignalR hub was returning 401 Unauthorized because:
1. The hub is protected with `[Authorize]` attribute
2. SignalR connections were not sending authentication tokens
3. The negotiate endpoint requires authentication

## Solution

### 1. Updated SignalR Hook (`useChatClient.ts`)
Added `getAccessToken` parameter to the hook and configured SignalR's `accessTokenFactory`:

```typescript
interface UseSignalRChatOptions {
  threadId?: string;
  onMessageReceived?: (message: Message) => void;
  getAccessToken?: () => Promise<string | null>;  // Added
}

// In HubConnectionBuilder:
.withUrl(`${apiUrl}/hubs/chat`, {
  skipNegotiation: false,
  transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
  accessTokenFactory: async () => {
    if (getAccessToken) {
      const token = await getAccessToken();
      return token || '';
    }
    return '';
  }
})
```

### 2. Updated ChatWindow Component
Added MSAL integration to get access tokens and pass them to the SignalR hook:

```typescript
const { instance, accounts } = useMsal();

const getAccessToken = useCallback(async (): Promise<string | null> => {
  const account = accounts[0];
  if (!account) return null;
  
  try {
    const response = await instance.acquireTokenSilent({
      scopes: ['openid', 'profile', 'email'],
      account: account,
    });
    return response.idToken;
  } catch (error) {
    // Fallback to popup
    const response = await instance.acquireTokenPopup({
      scopes: ['openid', 'profile', 'email'],
      account: account,
    });
    return response.idToken;
  }
}, [instance, accounts]);

useSignalRChat({
  threadId: thread?.id,
  onMessageReceived: handleMessageReceived,
  getAccessToken,  // Pass the function
});
```

### 3. Backend Configuration
Updated `Program.cs` to not validate audience (for development with ID tokens):

```csharp
.AddMicrosoftIdentityWebApi(options =>
{
    builder.Configuration.Bind("AzureAd", options);
    options.TokenValidationParameters.NameClaimType = "name";
    options.TokenValidationParameters.RoleClaimType = "roles";
    options.TokenValidationParameters.ValidateAudience = false;  // Added
},
```

## How It Works

1. When the ChatWindow component mounts, it creates the `getAccessToken` function
2. This function is passed to the `useSignalRChat` hook
3. When SignalR connects, it calls `accessTokenFactory` which uses our `getAccessToken` function
4. The token is sent with the negotiate request and all subsequent SignalR messages
5. The backend validates the token and allows the connection

## Testing

To verify the fix:
1. Check browser console for "SignalR connected successfully"
2. The negotiate endpoint should now return 200 instead of 401
3. Real-time messaging should work

## Notes

- Using ID tokens instead of access tokens (no custom API scope registered in Azure AD)
- Backend has `ValidateAudience = false` for development
- For production, consider registering a custom API in Azure AD and using access tokens with proper audience validation
