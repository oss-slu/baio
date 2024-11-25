import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import config from '../../config.json';
import './ResetPassword.css';

/**
 * @file ResetPassword.js
 *
 * @description
 * This file defines the `ResetPassword` React component, which provides a user interface for resetting a password.
 * Users can set a new password by entering and confirming it, with validation for password strength and matching.
 * A secure token is used to authenticate the request, and upon success, users are redirected to the login screen.
 *
 * @key_features
 * - **Password Validation**: Ensures the new password meets specific complexity requirements.
 * - **Password Confirmation**: Validates that the confirmed password matches the new password.
 * - **Secure Token Integration**: Uses a token from the URL query parameters to authenticate the reset request.
 * - **Real-Time Error Feedback**: Displays validation errors for password fields and server responses.
 * - **Password Visibility Toggle**: Allows users to show or hide their password input for better usability.
 * - **Success Message and Redirection**: Displays a success message and redirects the user to the login page after a successful reset.
 *
 * @usage_instructions
 * 1. Import the component and include it in your routing setup.
 *    `import ResetPassword from './ResetPassword';`
 * 2. Ensure the backend API endpoint (`/reset-password`) is configured to handle password reset requests.
 * 3. Pass a valid token in the URL query parameters (e.g., `/reset-password?token=your-token-here`).
 * 4. Customize styles using the accompanying `ResetPassword.css` file.
 */

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const port = config.port;
  const token = searchParams.get("token");

  const validatePassword = (password) => {
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
    if (!/\d/.test(password)) return 'Password must include at least one number.';
    if (!/[@$!%*#?&]/.test(password)) return 'Password must include at least one special character.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages at the start of a new submission
    setMessage('');
    setError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate password
    const passwordValidationError = validatePassword(newPassword);
    setPasswordError(passwordValidationError);
    if (passwordValidationError) return;

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    } else {
      setConfirmPasswordError('');
    }

    try {
      const response = await fetch(`http://localhost:${port}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      if (response.status === 200) {
        setMessage(data.message);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setError("Failed to reset password. Please try again.");
    }
  };

  return (
    <Container maxWidth="sm" className="reset-container">
      <Box className="reset-box">
        <Typography variant="h4" className="reset-heading">
          Reset Password
        </Typography>
        <form onSubmit={handleSubmit} noValidate className="reset-form">
          <TextField
            label="New Password"
            type={passwordVisible ? 'text' : 'password'}
            variant="outlined"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={!!passwordError}
            helperText={passwordError}
            InputProps={{
              endAdornment: (
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  edge="end"
                >
                  {passwordVisible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />
          <TextField
            label="Confirm Password"
            type={confirmPasswordVisible ? 'text' : 'password'}
            variant="outlined"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!confirmPasswordError}
            helperText={confirmPasswordError}
            InputProps={{
              endAdornment: (
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  edge="end"
                >
                  {confirmPasswordVisible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />
          <div className="message-space">
            {error && <Typography className="error-message">{error}</Typography>}
            {message && <Typography className="success-message">{message}</Typography>}
          </div>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            className="reset-button"
          >
            Reset Password
          </Button>
        </form>
      </Box>
    </Container>
  );
}

export default ResetPassword;
