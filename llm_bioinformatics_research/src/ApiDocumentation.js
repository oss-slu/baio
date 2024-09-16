import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Paper, Link } from '@mui/material';

const ApiDocumentation = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        API Documentation
      </Typography>
      <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
        <Typography variant="h5">API Name</Typography>
        <Typography>Description: Provide details about the API here.</Typography>
        <Typography>Usage: Explain how to use the API.</Typography>
        <Typography>Endpoint: <code>/api/endpoint</code></Typography>
        <Typography>Method: <code>GET / POST</code></Typography>
        <Typography>Parameters: List of parameters required for the API.</Typography>
        <Typography>Example: Example usage of the API.</Typography>
      </Paper>
      <Button variant="contained" color="primary" onClick={() => navigate('/')}>
        Back to Home
      </Button>
      <Typography variant="body1" style={{ marginTop: '20px' }}>
        For more information on authentication, visit{' '}
        <Link href="https://api.slack.com/authentication" target="_blank" rel="noopener noreferrer" underline="hover">
          Slack Authentication Documentation
        </Link>.
      </Typography>
    </Container>
  );
};

export default ApiDocumentation;
