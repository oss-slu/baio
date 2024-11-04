import React, { useState, useEffect, useContext } from 'react';
import { Box, Menu, MenuItem, IconButton, Avatar, Typography, FormControl, Select, InputLabel, Grid,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button} from '@mui/material';
import { PersonOutline as PersonOutlineIcon, Settings as SettingsIcon, Logout as LogoutIcon, Close as CloseIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import './UserProfileMenu.css';
import config from '../../config';
import ThemeContext from '../../Context/ThemeContext';

const UserProfileMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState({
    image: '',
    name: '',
    theme: 'system',
    language: 'en'
  });
  
  const { toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const port = config.port;

  useEffect(() => {
    const savedUserData = JSON.parse(localStorage.getItem('userData'));
    if (savedUserData) {
      setUser({
        name: savedUserData.username || '',
        image: savedUserData.profile_photo || '',

        theme: savedUserData.theme || 'system',
        language: savedUserData.language || 'en'
      });
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
  const handleThemeChange = async (e) => {
    const newTheme = e.target.value;
    setUser((prev) => ({ ...prev, theme: newTheme })); 
    toggleTheme(newTheme); 
    await updateUserSettings(newTheme, user.language); 
  };

  const handleLanguageChange = async (e) => {
    const newLanguage = e.target.value;
    setUser((prev) => ({ ...prev, language: newLanguage }));
  };

  const updateUserSettings = async (theme, language) => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const userId = userData ? userData.id : null;
  
    if (!userId) {
      alert('User ID not found. Please log in again.');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:' + port + '/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          profile_photo: userData.profile_photo || '',
          phone_number: userData.phone_number || '',
          location: userData.location || '',
          theme: theme,
          language: language
        }),
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update settings');
      }
  
      const updatedUserData = { 
        ...userData, 
        theme, 
        language 
      };
  
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
  
      const popup = document.createElement('div');
      popup.textContent = 'Settings updated successfully!';
      popup.classList.add('popup');
      document.body.appendChild(popup);
      setTimeout(() => {
        document.body.removeChild(popup);
      }, 3000);
      
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('An error occurred while updating settings');
    }
  };

  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const handleLogoutConfirmOpen = () => {
    setLogoutConfirmOpen(true);
  };

  const handleLogoutConfirmClose = () => {
    setLogoutConfirmOpen(false);
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
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu} className='menu'>
        <Box className="menu-header">
          <Avatar alt="User Image" src={user.image} className="user-avatar" />
          <Box sx={{ marginLeft: 2 }}>
            <Typography variant="body1">{user.name || 'Your name'}</Typography>
            <Typography variant="body2" color="textSecondary">{'Your name'}</Typography>
          </Box>
          <IconButton onClick={handleCloseMenu} size="small" aria-label="close menu">
            <CloseIcon />
          </IconButton>
        </Box>
        <MenuItem className="menu-item" onClick={() => navigate('/profile')}>
          <PersonOutlineIcon className="menu-item-icon" /> My Profile
          <ExpandMoreIcon style={{ marginLeft: 'auto', transform: 'rotate(-90deg)' }} />
        </MenuItem>
        <MenuItem className="menu-item" onClick={() => setSettingsOpen(!settingsOpen)} aria-labelledby='settings menu'>
          <SettingsIcon className="menu-item-icon" /> Settings
          <ExpandMoreIcon className={`expand-more-icon ${settingsOpen ? 'open' : 'closed'}`}/>
        </MenuItem>
        {settingsOpen && (
          <Box sx={{ padding: '0 16px', paddingBottom: '3px' }}>
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <FormControl variant="standard" sx={{ minWidth: 120 }}>
                  <InputLabel>Theme</InputLabel>
                  <Select value={user.theme} onChange={handleThemeChange} inputProps={{ 'aria-label': 'Theme' }}>
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="system">System Default</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item>
                <FormControl variant="standard" sx={{ minWidth: 120 }}>
                  <InputLabel>Language</InputLabel>
                  <Select value={user.language} onChange={handleLanguageChange}>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}
        <MenuItem onClick={handleLogoutConfirmOpen}>
          <LogoutIcon className="menu-item-icon" /> Log Out
        </MenuItem>
      </Menu>

      <Dialog
        open={logoutConfirmOpen}
        onClose={handleLogoutConfirmClose}
        aria-labelledby="logout-confirm-dialog-title"
        aria-describedby="logout-confirm-dialog-description"
      >
        <DialogTitle id="logout-confirm-dialog-title">Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-confirm-dialog-description">
            Are you sure you want to log out?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutConfirmClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogout} color="primary" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserProfileMenu;
