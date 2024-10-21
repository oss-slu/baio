import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Button, IconButton, TextField, MenuItem, Select, FormControl, InputLabel, AppBar, Toolbar, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { ManageAccounts, Settings, Logout } from '@mui/icons-material';
import { blue } from '@mui/material/colors';
import './UserProfile.css';
import ThemeContext from '../ThemeContext';
import config from '../config.json';

const UserProfile = () => {
  const [section, setSection] = useState('profile'); 
  const [user, setUser] = useState({
    image: '',
    name: '',
    email: '',
    phone: '',
    location: '',
    theme: 'system', 
    language: 'en'
  });
  const [phoneError, setPhoneError] = useState(''); 
  const [locationError, setLocationError] = useState(''); 

  const { themeMode, toggleTheme } = useContext(ThemeContext); 
  const navigate = useNavigate();
  const port = config.port;

  useEffect(() => {
    const savedUserData = JSON.parse(localStorage.getItem('userData'));
    if (savedUserData) {
      setUser((prevUser) => ({
        ...prevUser,
        name: savedUserData.username || '',
        email: savedUserData.email || '',
        phone: savedUserData.phone_number || '',
        location: savedUserData.location || '',
        image: savedUserData.profile_photo || '',
        theme: savedUserData.theme || 'light'
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
    if (name === 'phone') {
      setPhoneError(''); 
    }
    if (name === 'location') {
      setLocationError('');
    }

    if (name === 'theme') {
      toggleTheme(value);
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
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const isPhoneValid = (phone) => /^\d{3}-\d{3}-\d{4}$/.test(phone); 
  const isLocationValid = (location) => /^[A-Za-z\s]+,\s[A-Za-z\s]+$/.test(location); 

  const handleUpdate = async () => {
    if (!user.phone.trim()) {
      setPhoneError('Phone number is required');
      return;
    }
    if (!isPhoneValid(user.phone)) {
      setPhoneError('Invalid phone number. Please enter in the format XXX-XXX-XXXX');
      return;
    }
    if (!isLocationValid(user.location)) {
      setLocationError('Location is required');
      return;
    }
    const userData = JSON.parse(localStorage.getItem('userData'));
    const userId = userData ? userData.id : null;

    if (!userId) {
      alert('User ID not found. Please log in again.');
      return;
    }

    const updateFields = {};
    if (user.image !== userData.profile_photo) updateFields.profile_photo = user.image;
    if (user.phone !== userData.phone_number) updateFields.phone_number = user.phone;
    if (user.location !== userData.location) updateFields.location = user.location;
    if (user.theme !== userData.theme) updateFields.theme = user.theme;
    
    if (Object.keys(updateFields).length === 0) {
        alert('No changes made.');
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
                ...updateFields, // Spread the fields that have changed
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update profile');
        }

        alert('Profile updated successfully');
        // update local storage with the new values
        localStorage.setItem('userData', JSON.stringify({ ...userData, ...updateFields }));
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('An error occurred while updating the profile');
    }
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
          <ManageAccounts /> My Profile
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
          <Box sx={{ position: 'relative', display: 'inline-block' }} className="avatar-container">
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
            InputProps={{ readOnly: true }} // Make name field read-only
          />
          <TextField
            label="Email"
            name="email"
            value={user.email}
            className="input-field"
            margin="normal"
            InputProps={{ readOnly: true }} // Make email field read-only
          />
          <TextField
            label="Phone Number"
            name="phone"
            value={user.phone}
            onChange={handleInputChange}
            className="input-field"
            margin="normal"
            error={Boolean(phoneError)} 
            helperText={phoneError} 
          />
          <TextField
            label="Location"
            name="location"
            value={user.location}
            onChange={handleInputChange}
            className="input-field"
            margin="normal"
            error={Boolean(locationError)} 
            helperText={locationError} 
          />
          <Button variant="contained" color="primary" onClick={handleUpdate}>
            Update
          </Button>
        </Box>
      )}

      {section === 'settings' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="settings-section">
          <FormControl className="input-field" margin="normal">
            <InputLabel id="theme">Theme</InputLabel>
            <Select
              labelId="theme selector"
              label="Theme"
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
          <Button className="update-button" variant="contained" color="primary" onClick={handleUpdate} sx={{ marginTop: 2 }}>
            Update
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default UserProfile