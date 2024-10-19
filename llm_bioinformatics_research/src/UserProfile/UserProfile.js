import React, { useState, useContext } from 'react';
import { Box, Typography, Button, IconButton, TextField, MenuItem, Select, FormControl, InputLabel, AppBar, Toolbar, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { ManageAccounts, Settings, Logout } from '@mui/icons-material';
import {blue} from '@mui/material/colors';
import './UserProfile.css';
import ThemeContext from '../ThemeContext';

const UserProfile = () => {
  const [section, setSection] = useState('profile'); 
  const [user, setUser] = useState({
    image: '',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
    location: 'New York, USA',
    theme: 'system', 
    language: 'en'
  });

  const { themeMode, toggleTheme } = useContext(ThemeContext); 
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });

    if (name === 'theme') {
      if (value === 'light') {
        toggleTheme('light');
      } else if (value === 'dark') {
        toggleTheme('dark');
      } else {
        toggleTheme('system');
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser({ ...user, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    navigate('/login'); // Placeholder for actual logout logic
  };

  return (
    <Box className="userProfile-container">
      <AppBar position="static" className="appBar">
        <Toolbar>
          <Typography variant="h4" className="title">
            User Profile
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/home')}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box className="button-section">
        <Button
          onClick={() => setSection('profile')}
          sx={{
            color: themeMode === 'dark' || section === 'profile' ? 'white' : 'black',
            backgroundColor: section === 'profile' ? blue[500] : 'transparent',
            '&:hover': {
              backgroundColor: section === 'profile' ? blue[700] : 'lightgray',
            },
          }}
        >
          <ManageAccounts /> MyProfile
        </Button>

        <Button
          onClick={() => setSection('settings')}
          sx={{
            color: themeMode === 'dark' || section === 'settings' ? 'white' : 'black',
            backgroundColor: section === 'settings' ? blue[500] : 'transparent',
            '&:hover': {
              backgroundColor: section === 'settings' ? blue[700] : 'lightgray',
            },
          }}
        >
          <Settings /> Settings
        </Button>

        <Button
          onClick={handleLogout}
          sx={{
            color: themeMode === 'dark' ? 'white' : 'black',
            '&:hover': {
              backgroundColor: 'lightgray',
            },
          }}
        >
          <Logout /> Logout
        </Button>
      </Box>

      {section === 'profile' && (
        <Box className="profile-section">
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Avatar
              alt="User Image"
              src={user.image}
              sx={{ width: '15vh', height: '15vh', mr: 2 }}
            />
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'background.paper',
                borderRadius: '50%',
                border: '1px solid',
                borderColor: 'divider',
                width: '5vh',
                height: '5vh',
              }}
              component="label"
            >
              <EditIcon />
              <input type="file" hidden accept="image/*" onChange={handleImageChange} />
            </IconButton>
          </Box>

          <TextField
            label="Name"
            name="name"
            value={user.name}
            className="input-field"
            margin="normal"
          />
          <TextField
            label="Email"
            name="email"
            value={user.email}
            className="input-field"
            margin="normal"
          />
          <TextField
            label="Phone Number"
            name="phone"
            value={user.phone}
            onChange={handleInputChange}
            className="input-field"
            margin="normal"
          />
          <TextField
            label="Location"
            name="location"
            value={user.location}
            onChange={handleInputChange}
            className="input-field"
            margin="normal"
          />
        </Box>
      )}

      {section === 'settings' && (
        <Box className="settings-section">
          <FormControl className="input-field" margin="normal">
            <InputLabel id="theme" >Theme</InputLabel>
            <Select
              data-testid="theme selector"
              labelId="theme selector"
              label="Theme Selector"
              name="theme"
              id="theme"
              value={user.theme}
              onChange={handleInputChange}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="system">System Default</MenuItem>
            </Select>
          </FormControl>
          <FormControl className="input-field" margin="normal">
            <InputLabel id="language">Language</InputLabel>
            <Select
              data-testid="language selector"
              labelId="language"
              label="Language"
              name="language"
              id="language"
              value={user.language}
              onChange={handleInputChange}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Spanish</MenuItem>
              <MenuItem value="fr">French</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}
    </Box>
  );
};

export default UserProfile;
