import React, { useState, useEffect } from 'react';
import { TextField, Button, Container, Typography, Box, IconButton, Link } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';

function SignUpScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [retypePasswordError, setRetypePasswordError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [retypePasswordVisible, setRetypePasswordVisible] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (signupSuccess) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [signupSuccess, navigate]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must include at least one uppercase letter.');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setPasswordError('Password must include at least one lowercase letter.');
      return false;
    }
    if (!/\d/.test(password)) {
      setPasswordError('Password must include at least one number.');
      return false;
    }
    if (!/[@$!%*#?&]/.test(password)) {
      setPasswordError('Password must include at least one special character.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateRetypePassword = (password, retypePassword) => {
    if (password !== retypePassword) {
      setRetypePasswordError('Passwords do not match.');
      return false;
    }
    setRetypePasswordError('');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isRetypePasswordValid = validateRetypePassword(password, retypePassword);

    if (isEmailValid && isPasswordValid && isRetypePasswordValid) {
      setSignupSuccess(true);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <Typography variant="h4" gutterBottom data-testid="signup-heading">
          Sign Up
        </Typography>

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            id="username"
            label="Username"
            type="text"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            inputProps={{
              'data-testid': 'username-input',
            }}
          />
          <TextField
            id="email"
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!emailError}
            helperText={emailError}
            inputProps={{
              'data-testid': 'email-input',
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
            error={passwordError !== ''}
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
            inputProps={{
              'data-testid': 'password-input',
            }}
          />
          <TextField
            id="retypePassword"
            label="Confirm Password"
            type={retypePasswordVisible ? 'text' : 'password'}
            variant="outlined"
            fullWidth
            margin="normal"
            value={retypePassword}
            onChange={(e) => setRetypePassword(e.target.value)}
            error={retypePasswordError !== ''}
            helperText={retypePasswordError || (password === retypePassword && retypePassword ? '✓ Passwords match' : '')}
            InputProps={{
              endAdornment: (
                <IconButton
                  aria-label="toggle retype password visibility"
                  onClick={() => setRetypePasswordVisible(!retypePasswordVisible)}
                  edge="end"
                >
                  {retypePasswordVisible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
            inputProps={{
              'data-testid': 'retype-password-input',
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            data-testid="signup-button"
          >
            Sign Up
          </Button>

          {signupSuccess && (
            <Typography
              variant="body1"
              color="success.main"
              sx={{ mt: 2 }}
              data-testid="signup-success-message"
            >
              Successfully signed up! You will be redirected to the login page in 5 seconds.
            </Typography>
          )}

          <Box sx={{ mt: 2, textAlign: 'center' }}>
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
              }}
            >
              Sign in with Google
            </Button>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<GitHubIcon />}
              sx={{
                borderColor: '#000',
                color: '#000',
                borderRadius: '50px',
                padding: '10px 20px',
                textTransform: 'none',
              }}
            >
              Sign in with GitHub
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Already have an account? Login
            </Link>
          </Box>
        </form>
      </Box>
    </Container>
  );
}

export default SignUpScreen;