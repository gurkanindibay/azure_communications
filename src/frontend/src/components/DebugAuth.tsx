import React, { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { Box, Paper, Typography, Button, Divider } from '@mui/material';

export const DebugAuth: React.FC = () => {
  const { instance, accounts } = useMsal();
  const [token, setToken] = useState<string>('');
  const [tokenError, setTokenError] = useState<string>('');

  const account = accounts[0];

  const getToken = async () => {
    if (!account) {
      setTokenError('No account found');
      return;
    }

    try {
      const response = await instance.acquireTokenSilent({
        scopes: ['openid', 'profile', 'email'],
        account: account,
      });
      setToken(response.idToken);
      setTokenError('');
      console.log('ID Token:', response.idToken);
      console.log('Token claims:', response.idTokenClaims);
    } catch (error) {
      setTokenError(error instanceof Error ? error.message : 'Unknown error');
      console.error('Token error:', error);
    }
  };

  useEffect(() => {
    if (account) {
      getToken();
    }
  }, [account]);

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Authentication Debug Info
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6">Account Info:</Typography>
        {account ? (
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(account, null, 2)}
          </pre>
        ) : (
          <Typography color="error">No account found</Typography>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6">Token:</Typography>
        <Button onClick={getToken} variant="contained" sx={{ mb: 2 }}>
          Get Token
        </Button>
        {tokenError && (
          <Typography color="error" sx={{ mb: 1 }}>
            Error: {tokenError}
          </Typography>
        )}
        {token && (
          <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '300px' }}>
            {token}
          </pre>
        )}
      </Paper>
    </Box>
  );
};
