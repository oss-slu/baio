import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, IconButton, Link } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';
import config from '../../config.json';
import './LoginScreen.css';

/**
 * @file LoginScreen.js
 *
 * @description
 * This file defines the `LoginScreen` React component, which provides a user authentication interface.
 * Users can log in using their email/username and password or via Google OAuth. The component validates
 * input, handles login requests to the backend, and manages error feedback. Upon successful login, it 
 * stores authentication tokens and redirects users to the home page.
 *
 * @key_features
 * - **Email/Username and Password Login**: Allows users to log in using their credentials.
 * - **Password Visibility Toggle**: Users can show or hide their password while typing.
 * - **Error Handling**: Displays appropriate error messages for invalid credentials or server issues.
 * - **Google OAuth Login**: Enables login using Google credentials via an OAuth flow.
 * - **Redirection on Success**: Navigates the user to the home screen upon successful login.
 * - **Responsive Design**: Styled using Material-UI for a modern and responsive layout.
 *
 * @usage_instructions
 * 1. Import the component and render it in your application.
 *    `import LoginScreen from './LoginScreen';`
 * 2. Pass the `setIsLoggedIn` function as a prop to manage authentication state.
 * 3. Ensure the server configuration (port and endpoints) is set correctly in `config.json`.
 * 4. Customize the styles using `LoginScreen.css` as needed.
 */

function LoginScreen({ setIsLoggedIn }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();
  const port = config.port;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      setLoginError('Both email/username and password are required.');
      return;
    }

    try {
      const response = await fetch('http://localhost:' + port + '/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.status === 200) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        setIsLoggedIn(true);
        navigate('/home', { replace: true });
      } else {
        setLoginError(data.message || 'Invalid email/username or password');
      }
    } catch (error) {
      console.error('Failed to login:', error);
      setLoginError('An error occurred while trying to log in. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm" className="login-container">
      <Box className="login-box">
        <Typography variant="h4" gutterBottom data-testid="login-heading">
          Login
        </Typography>
        <form onSubmit={handleSubmit} noValidate>
          <TextField
            id="identifier"
            label="Email or Username"
            type="text"
            variant="outlined"
            fullWidth
            margin="normal"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            inputProps={{
              'data-testid': 'identifier-input',
            }}
          />
          <TextField
            id="password"
            label="Password"
            type={passwordVisible ? 'text' : 'password'}
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            inputProps={{
              'data-testid': 'password-input',
            }}
          />
          {loginError && (
            <Typography variant="body2" color="error" className="login-error" data-testid="login-error">
              {loginError}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            className="login-button"
            data-testid="login-button"
          >
            Login
          </Button>
          <Box className="social-login">
            <Button
              variant="outlined"
              fullWidth
              startIcon={<GoogleIcon />}
              sx={{
                mb: 2,
                borderColor: '#db4437',
                color: '#db4437',
                borderRadius: '50px',
                padding: '10px 20px',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#db4437',
                  color: '#fff',
                },
              }}
              onClick={() => window.location.href = 'http://localhost:' + port + '/auth/google/login'}
            >
              Login with Google
            </Button>
          </Box>
          <Box className="login-links">
            <Link component={RouterLink} to="/forgot_password" variant="body2">
              Forgot Password
            </Link>
          </Box>
          <Box className="signup-link">
            <Link component={RouterLink} to="/signup" variant="body2">
              Sign Up
            </Link>
          </Box>
        </form>
      </Box>
    </Container>
  );
}

export default LoginScreen;
