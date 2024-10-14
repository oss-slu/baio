import React, { useState } from 'react';
import { Box, Typography, Button, IconButton, TextField, MenuItem, Select, FormControl, InputLabel, AppBar, Toolbar, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { ManageAccounts, Settings, Logout } from '@mui/icons-material';
import './UserProfile.css';

const UserProfile = () => {
  const [section, setSection] = useState('profile');
  const [user, setUser] = useState({
    image: '',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
    location: 'New York, USA',
    theme: 'light',
    language: 'en'
  });
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
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
          className={section === 'profile' ? 'default-button' : 'selected-button'}
        >
          <ManageAccounts /> MyProfile
        </Button>

        <Button
          onClick={() => setSection('settings')}
          className={section === 'settings' ? 'default-button' : 'selected-button'}
        >
          <Settings /> Settings
        </Button>

        <Button onClick={handleLogout} className="logout-button" aria-label='logoutbutton'>
          <Logout /> Logout
        </Button>
      </Box>

      {section === 'profile' && (
        <Box className="profile-section">
          <Box className="avatar-container">
            <Avatar alt="User Image" src={user.image} className="avatar" />
              <IconButton className="edit-icon" component="label">
                <EditIcon />
                <input type="file" hidden accept="image/*" onChange={handleImageChange} data-testid ='avatar-upload' />
              </IconButton>
          </Box>

          <TextField
            label="Name"
            name="name"
            value={user.name}
            onChange={handleInputChange}
            className="input-field"
            margin="normal"
          />
          <TextField
            label="Email"
            name="email"
            value={user.email}
            onChange={handleInputChange}
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
            <InputLabel>Theme</InputLabel>
            <Select
              name="theme"
              value={user.theme}
              onChange={handleInputChange}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="system">System Default</MenuItem>
            </Select>
          </FormControl>
          <FormControl className="input-field" margin="normal">
            <InputLabel>Language</InputLabel>
            <Select
              name="language"
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
