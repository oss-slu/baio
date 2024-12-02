import React from 'react';
import { Container, Typography, Paper, Link, TextField} from '@mui/material';

/**
 * @file APIDocumentation.js
 *
 * @description
 * This file contains the `APIDocumentation` React component, which provides a user-friendly interface
 * for viewing and searching through API details. The component renders a searchable list of APIs,
 * including their descriptions, usage examples, endpoints, HTTP methods, and parameters.
 *
 * @key_features
 * - Renders API details dynamically from an `apis` array.
 * - Supports a search functionality to filter APIs based on user input.
 * - Provides structured API information, including usage examples and endpoints.
 * - Includes links to external documentation for further information.
 *
 * @usage_instructions
 * 1. Import the component into your React application.
 *    `import APIDocumentation from './APIDocumentation';`
 * 2. Render the component wherever API documentation is needed.
 * 3. Ensure the `apis` array contains the API details to display.
 */

const apis = [
  {
    name: "User API",
    description: "Manages user data and authentication.",
    usage: "Used for handling user logins, registrations, and profile updates.",
    endpoint: "/api/users",
    method: "GET / POST",
    parameters: "id (optional), name, email, password",
    example: "GET /api/users?id=1"
  },
  {
    name: "Product API",
    description: "Retrieves product information.",
    usage: "Fetch details about products, including prices and stock availability.",
    endpoint: "/api/products",
    method: "GET",
    parameters: "id (optional), category",
    example: "GET /api/products?id=123"
  }
];

const APIDocumentation = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const filteredApis = apis.filter((api) => 
    api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    api.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    api.endpoint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container sx={{ mt: 6 }}>
      <Typography variant="h4" gutterBottom>API Documentation
      </Typography>
      <TextField
        label="Search APIs"
        variant="outlined"
        fullWidth
        style={{ marginBottom: '20px' }}
        margin="normal"
        color="primary"
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
        <ul>
          {filteredApis.length > 0 ? (
            filteredApis.map((api, index) => (
              <li key={index}>
                <Typography variant="h5">{api.name}</Typography>
                <Typography>Description: {api.description}</Typography>
                <Typography>Usage: {api.usage}</Typography>
                <Typography>Endpoint: <code>{api.endpoint}</code></Typography>
                <Typography>Method: <code>{api.method}</code></Typography>
                <Typography>Parameters: {api.parameters}</Typography>
                <Typography>Example: {api.example}</Typography>
              </li>
            ))

            ) : (
              <Typography>No APIs found</Typography>
            )}
        </ul>
      </Paper>
      <Typography variant="body1" style={{ marginTop: '20px' }}>
        For more information on authentication, visit{' '}
        <Link href="https://api.slack.com/authentication" target="_blank" rel="noopener noreferrer" underline="hover">
          Slack Authentication Documentation
        </Link>.
      </Typography>
    </Container>
  );
};

export default APIDocumentation;
