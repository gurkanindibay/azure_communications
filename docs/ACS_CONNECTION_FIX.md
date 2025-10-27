# ACS Connection Issue - Fix Applied

## Problem
Users were seeing the error: **"Chat service not connected. Please refresh the page."**

This was happening because the ACS (Azure Communication Services) connection wasn't being properly initialized in the ChatWindow component.

## Root Cause

The `ChatWindow` component was trying to:
1. Fetch its own ACS token locally
2. Initialize its own ACS connection
3. But the token was already available in `AuthContext`

This caused a disconnect between where the token was stored (AuthContext) and where it was needed (ChatWindow).

## Changes Made

### 1. ChatWindow Component (`src/frontend/src/components/ChatWindow.tsx`)

**Before:**
```typescript
const { user } = useAuth();
const [acsToken, setAcsToken] = useState<string | null>(null);
const [acsEndpoint, setAcsEndpoint] = useState<string | null>(null);

const getAcsToken = useCallback(async () => {
  const response = await apiService.getAcsToken();
  setAcsToken(response.token);
  setAcsEndpoint(response.endpoint);
  return response.token;
}, []);

// Later trying to use local token
if (!acsConnected && !acsToken) {
  getAcsToken().then(token => {
    if (token && acsEndpoint) {
      initializeChat(token, acsEndpoint);
    }
  });
}
```

**After:**
```typescript
// Get ACS token directly from AuthContext
const { user, acsToken, acsEndpoint } = useAuth();

// Initialize when token is available
if (!acsConnected && acsToken && acsEndpoint) {
  initializeChat(acsToken, acsEndpoint);
}
```

**Why this fixes it:**
- The `AuthContext` already fetches the ACS token when the user logs in
- `ChatWindow` now uses that centralized token instead of trying to fetch its own
- Proper dependency tracking ensures initialization happens when token becomes available

### 2. Added Connection Status Indicator

Added a visual indicator in the chat header to show connection status:

```typescript
{!acsConnected ? (
  <>
    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
    <Typography variant="caption" color="warning.main">Connecting...</Typography>
  </>
) : (
  <>
    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
    <Typography variant="caption" color="success.main">Connected</Typography>
  </>
)}
```

Users can now see:
- 🟡 **Yellow dot**: Connecting...
- 🟢 **Green dot**: Connected

### 3. Improved Error Handling

Enhanced error messages with logging:

```typescript
if (!acsConnected) {
  console.error('ACS not connected. Token:', !!acsToken, 'Endpoint:', !!acsEndpoint);
  throw new Error('Chat service not connected. Please wait a moment or refresh the page.');
}
```

This helps diagnose whether the issue is:
- Missing token
- Missing endpoint
- Connection failure

### 4. Enhanced Logging

Added detailed logging at key points:

**In AuthContext:**
```typescript
console.log('Fetching ACS token for user:', user.id);
console.log('ACS token received:', {
  hasToken: !!response.token,
  hasEndpoint: !!response.endpoint,
  endpoint: response.endpoint
});
```

**In ACS Chat Service:**
```typescript
console.log('Initializing ACS chat service...', {
  hasToken: !!token,
  endpoint,
  hasEventHandlers: !!eventHandlers
});
console.log('ACS chat service initialized successfully, real-time notifications started');
```

## How It Works Now

### Connection Flow

```
1. User logs in
   └─> AuthContext fetches user profile
       └─> AuthContext calls refreshAcsToken()
           └─> Backend /api/auth/acs-token generates token
               └─> AuthContext stores: acsToken, acsEndpoint

2. User opens chat
   └─> ChatWindow component mounts
       └─> Gets acsToken & acsEndpoint from AuthContext
           └─> useAcsChat hook initializes with token
               └─> ACS ChatClient created
                   └─> Real-time notifications started
                       └─> isConnected = true ✅
```

### When User Sends Message

```
1. User types and clicks send
2. ChatWindow checks: if (!acsConnected) → show error
3. If connected: acsSendMessage(content)
4. ACS Chat SDK sends directly to Azure
5. Message delivered in real-time to recipient
6. Message appears via chatMessageReceived event
```

## Testing the Fix

### Check 1: Connection Status Indicator
1. Open chat page
2. Look at chat header
3. Should see 🟡 "Connecting..." briefly
4. Then 🟢 "Connected"

### Check 2: Console Logs
Open browser DevTools Console and look for:

```
✅ Fetching ACS token for user: <user-id>
✅ ACS token received: { hasToken: true, hasEndpoint: true, ... }
✅ Initializing ACS chat service...
✅ ACS chat service initialized successfully, real-time notifications started
✅ Joined ACS chat thread: <thread-id>
```

### Check 3: Send Message
1. Type a message
2. Click send
3. Should see: "Message sent successfully: <message-id>"
4. Message appears immediately
5. **No** API call to `/api/chats/messages` (check Network tab)

### Check 4: Error Handling
If connection fails, you should see:
```
❌ ACS not connected. Token: true/false, Endpoint: true/false
```

This tells you what's missing.

## Common Issues & Solutions

### Issue: Still seeing "Chat service not connected"

**Check:**
```
1. Open Console
2. Look for: "ACS token received"
3. Check if hasToken: true and hasEndpoint: true
```

**If hasToken is false:**
- Backend `/api/auth/acs-token` is failing
- Check backend logs
- Verify ACS connection string in appsettings.json

**If hasEndpoint is false:**
- Backend is not returning endpoint
- Check `AcsTokenResponse` in AuthController
- Verify ACS endpoint configuration

### Issue: Connection drops after a while

**Solution:**
- ACS tokens expire (default: 24 hours)
- Need to implement token refresh
- Add refresh logic before expiry:

```typescript
useEffect(() => {
  // Refresh token 1 hour before expiry
  const refreshInterval = setInterval(() => {
    refreshAcsToken();
  }, 23 * 60 * 60 * 1000); // 23 hours

  return () => clearInterval(refreshInterval);
}, [refreshAcsToken]);
```

### Issue: Messages not appearing in real-time

**Check:**
1. Is `isConnected` true? (Look for green dot)
2. Are event handlers registered?
3. Check console for "New message received via ACS"

**Solution:**
- Ensure `onMessageReceived` callback is set
- Verify thread ID matches
- Check ACS real-time notifications are started

## Architecture Verification

### ✅ Correct Flow (Now Implemented)
```
Frontend → Get token from AuthContext → Initialize ACS → Send directly to ACS
```

### ❌ Wrong Flow (Previous Issue)
```
Frontend → Try to fetch own token → Token not available → Connection fails
```

## Next Steps

### Recommended Improvements

1. **Token Refresh Logic**
   - Implement auto-refresh before expiry
   - Handle token expiration gracefully

2. **Reconnection Logic**
   - Auto-reconnect if connection drops
   - Exponential backoff

3. **Connection State Management**
   - Better state management for connection lifecycle
   - Handle network offline/online events

4. **Error Recovery**
   - Retry logic for failed connections
   - User-friendly error messages

## Files Modified

- ✅ `src/frontend/src/components/ChatWindow.tsx`
- ✅ `src/frontend/src/contexts/AuthContext.tsx`
- ✅ `src/frontend/src/services/acsChatService.ts`

## Testing Checklist

- [ ] User can log in successfully
- [ ] ACS token is fetched (check console logs)
- [ ] Connection indicator shows "Connecting..." then "Connected"
- [ ] User can send messages
- [ ] Messages appear in real-time
- [ ] No errors in console
- [ ] No calls to `/api/chats/messages` when sending

## Summary

The fix centralizes ACS token management in `AuthContext` and ensures `ChatWindow` uses that centralized token. This eliminates the timing issue where `ChatWindow` tried to fetch its own token before the component had the necessary data.

**Key Change:** 
```diff
- const [acsToken, setAcsToken] = useState<string | null>(null);
+ const { user, acsToken, acsEndpoint } = useAuth();
```

This simple change ensures the token is always available when needed, fixing the "Chat service not connected" error.
