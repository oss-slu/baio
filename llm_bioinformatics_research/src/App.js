import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import {Box, Typography, AppBar, Toolbar, Button } from '@mui/material';
import { blue } from '@mui/material/colors';
import LoginScreen from './LoginScreen/LoginScreen';
import HomeScreen from './HomeScreen/HomeScreen';  // Import HomeScreen
import ApiDocumentation from './ApiDocumentation/ApiDocumentation';  
import References from './References/References'; 
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <>
      {!isLoginPage && (
      <AppBar position="static" sx={{ bgcolor: blue[500] }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 0 }}>
            Better Bioinformatics
          </Typography>

          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button component ={Link} to="/home" sx={{ color: 'white' }}>Home</Button>
            <Button sx={{ color: 'white' }}>Guidelines</Button>
            <Button component={Link} to="/api-documentation" sx={{ color: 'white' }}>API documentation</Button>
            <Button sx={{ color: 'white' }}>User Profile</Button>
            <Button component={Link} to="/references" sx={{ color: 'white' }}>References</Button>
          </Box>
        </Toolbar>
      </AppBar>
      )}

    {children}
  </>
  );
};




function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/home" element={<Layout><HomeScreen /></Layout>} />
          <Route path="/api-documentation" element={<Layout><ApiDocumentation /></Layout>} />
          <Route path="/references" element={<Layout><References /></Layout>} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;