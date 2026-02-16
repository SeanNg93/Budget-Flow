import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';

const TestConnection = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const testConnection = async () => {
    setStatus('loading');
    setError('');
    setMessage('');

    try {
      // Test the public endpoint
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/test/public`);
      setMessage(response.data.message || t('connection.successful'));
      setStatus('success');
    } catch (error) {
      setError(error.message || t('connection.failed'));
      setStatus('error');
    }
  };

  useEffect(() => {
    // Test connection on component mount
    testConnection();
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {t('connection.backendTest')}
      </Typography>

      {status === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {status === 'success' && (
        <Alert severity="success" sx={{ my: 2 }}>
          {message}
        </Alert>
      )}

      {status === 'error' && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      <Button 
        variant="contained" 
        onClick={testConnection} 
        disabled={status === 'loading'}
        sx={{ mt: 2 }}
      >
        {t('connection.testAgain')}
      </Button>
    </Box>
  );
};

export default TestConnection;
