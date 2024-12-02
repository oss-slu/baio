import React, { useState } from "react";
import { Container, Box, Typography, TextField, Button, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import config from '../../config.json';
import './ForgotPassword.css';

/**
 * @file ForgotPassword.js
 *
 * @description
 * This file defines the `ForgotPassword` React component, which provides a password recovery interface
 * for users who have forgotten their account credentials. It allows users to submit their email address
 * to receive a password reset link and displays appropriate success or error messages based on the server response.
 *
 * @key_features
 * - Input field for users to enter their email address.
 * - Submits a password reset request to a server endpoint.
 * - Displays dynamic messages for success or error feedback.
 * - Includes navigation links to login and signup pages.
 *
 * @usage_instructions
 * 1. Import the component into your React application.
 *    `import ForgotPassword from './ForgotPassword';`
 * 2. Ensure the server configuration (port and endpoint) is set correctly in `config.json`.
 * 3. Use appropriate styling via the accompanying `ForgotPassword.css` file.
 */

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const port = config.port;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch(`http://localhost:${port}/forgot_password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.status === 200) {
        setMessage(data.message);
      } else {
        setError(data.message || "Email not found");
      }
    } catch (error) {
      console.error("Error sending password reset request:", error);
      setError("An error occurred while sending the password reset request. Please try again.");
    }
  };

  return (
    <Container maxWidth="sm" className="forgot-password-container">
      <Box className="forgot-password-box">
        <Typography variant="h4" className="forgot-password-heading">
          Forgot Password
        </Typography>
        <form onSubmit={handleSubmit} noValidate className="forgot-password-form">
          <TextField
            id="email"
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="forgot-password-input"
          />
          
          <div className="message-space">
            {message && <Typography className="success-message">{message}</Typography>}
            {error && <Typography className="error-message">{error}</Typography>}
          </div>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            className="forgot-password-button"
          >
            SEND EMAIL
          </Button>

          <Box className="forgot-password-links">
            <Link component={RouterLink} to="/login" className="forgot-password-link">
              Already have an account? Login
            </Link>
          </Box>
          <Box className="forgot-password-links">
            <Link component={RouterLink} to="/signup" className="forgot-password-link">
              Need a new account? Sign up
            </Link>
          </Box>
        </form>
      </Box>
    </Container>
  );
}

export default ForgotPassword;