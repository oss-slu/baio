import React, { useState, useEffect, useContext } from 'react';
import { Box, Menu, MenuItem, IconButton, Avatar, Typography, FormControl, Select, InputLabel, Grid } from '@mui/material';
import { PersonOutline as PersonOutlineIcon, Settings as SettingsIcon, Logout as LogoutIcon, Close as CloseIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ThemeContext from '../ThemeContext';
import './UserProfileMenu.css';

const UserProfileMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState({
    image: '',
    name: '',
  });
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');
  const { toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUserData = JSON.parse(localStorage.getItem('userData'));
    if (savedUserData) {
      setUser({
        name: savedUserData.username || '',
        image: savedUserData.profile_photo || '',
      });
      setTheme(savedUserData.theme || 'system');
      setLanguage(savedUserData.language || 'en');
    }
  }, []);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSettingsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const handleThemeChange = (event) => {
    const newTheme = event.target.value;
    setTheme(newTheme);
    toggleTheme(newTheme);
    updateLocalStorage('theme', newTheme);
  };

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    updateLocalStorage('language', newLanguage);
  };

  const updateLocalStorage = (key, value) => {
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    userData[key] = value;
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const toggleSettings = () => {
    setSettingsOpen((prev) => !prev);
  };

  return (
    <>
      <IconButton onClick={handleOpenMenu} aria-label="user profile menu">
        {user.image ? (
          <Avatar src={user.image} alt="User Profile" className="user-avatar" />
        ) : (
          <PersonOutlineIcon />
        )}
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <Box className="menu-header">
          <Avatar alt="User Image" src={user.image} className="user-avatar" />
          <Box sx={{ marginLeft: 2 }}>
            <Typography variant="body1">{user.name || 'Your name'}</Typography>
            <Typography variant="body2" color="textSecondary">{user.name || 'Your name'}</Typography>
          </Box>
          <IconButton onClick={handleCloseMenu} size="small" aria-label="close menu">
            <CloseIcon />
          </IconButton>
        </Box>
        <MenuItem className="menu-item" onClick={() => navigate('/profile')}>
          <PersonOutlineIcon className="menu-item-icon" /> My Profile
          <ExpandMoreIcon style={{ marginLeft: 'auto', transform: 'rotate(-90deg)' }} />
        </MenuItem>
        <MenuItem className="menu-item" onClick={toggleSettings}>
          <SettingsIcon className="menu-item-icon" /> Settings
          <ExpandMoreIcon
            style={{
              transform: settingsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.3s',
              marginLeft: 'auto',
            }}
          />
        </MenuItem>
        {settingsOpen && (
          <Box sx={{ padding: '0 16px', paddingBottom: '3px' }}>
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <FormControl variant="standard" sx={{ minWidth: 120 }}>
                  <InputLabel>Theme</InputLabel>
                  <Select value={theme} onChange={handleThemeChange}>
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="system">System Default</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item>
                <FormControl variant="standard" sx={{ minWidth: 120 }}>
                  <InputLabel>Language</InputLabel>
                  <Select value={language} onChange={handleLanguageChange}>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}
        <MenuItem onClick={handleLogout}>
          <LogoutIcon className="menu-item-icon" /> Log Out
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserProfileMenu;
