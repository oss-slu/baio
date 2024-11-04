import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import { Box, Typography, AppBar, Toolbar, Button, IconButton } from '@mui/material';
import { blue } from '@mui/material/colors';
import LoginScreen from './Components/LoginScreen/LoginScreen';
import HomeScreen from './Components/HomeScreen/HomeScreen';
import ApiDocumentation from './Components/APIDocumentation/APIDocumentation';
import References from './Components/References/References';
import SignupScreen from './Components/SignupScreen/SignupScreen';
import UserProfile from './Components/UserProfile/UserProfile';
import { Link, useLocation } from 'react-router-dom';
import { ThemeContextProvider } from './Context/ThemeContext';
import UserProfileMenu from './UserProfile/UserProfileMenu';

const Layout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <>
      {!isLoginPage && (
      <AppBar position="static" sx={{ bgcolor: blue[500] }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 0 }}>
            Enhancing Bioinformatics
          </Typography>
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button component={Link} to="/home" sx={{ bgcolor: location.pathname === '/home' ? blue[800] : blue[500], 
              '&:hover': { backgroundColor: blue[600] }, color: 'white', m: 1 }}>Home</Button>
            <Button sx={{ color: 'white' }}>Guidelines</Button>
            <Button component={Link} to="/api-documentation" sx={{ bgcolor: location.pathname === '/api-documentation' ? blue[800] : blue[500], 
              '&:hover': { backgroundColor: blue[600] }, color: 'white', m: 1 }}>API documentation</Button>
            <Button component={Link} to="/references" sx={{ bgcolor: location.pathname === '/references' ? blue[800] : blue[500], 
              '&:hover': { backgroundColor: blue[600] }, color: 'white', m: 1 }}>References</Button>
            <UserProfileMenu/>
          </Box>
        </Toolbar>
      </AppBar>
      )}
      {children} 
    </>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function ProtectedRoute({ isLoggedIn, children }) {
    const navigate = useNavigate();
    useEffect(() => {
      if (!isLoggedIn) {
        navigate('/login', { replace: true });
      }
    }, [isLoggedIn, navigate]);

    return isLoggedIn ? children : null;
  }

  return (
    <Router>
      <ThemeContextProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
                    <HomeScreen setIsLoggedIn={setIsLoggedIn} />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/api-documentation" element={<Layout><ApiDocumentation /></Layout>} />
            <Route path="/references" element={<Layout><References /></Layout>} />
            <Route path="/signup" element={<SignupScreen />} />
            <Route path="/login" element={<LoginScreen setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/profile" element={<UserProfile />} />
          </Routes>
        </div>
      </ThemeContextProvider>
    </Router>
  );
}

export default App;
