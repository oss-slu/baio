import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Button, IconButton, TextField, AppBar, Toolbar, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { ManageAccounts, Logout } from '@mui/icons-material';
import { blue } from '@mui/material/colors';
import './UserProfile.css';
import ThemeContext from '../ThemeContext';
import config from '../config.json';

const UserProfile = () => {
  const [user, setUser] = useState({
    image: '',
    name: '',
    email: '',
    phone: '',
    location: '',
    theme: 'system',
    language: 'en',
  });
  const [phoneError, setPhoneError] = useState('');
  const [locationError, setLocationError] = useState('');

  const { themeMode } = useContext(ThemeContext);
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
        theme: savedUserData.theme || 'light',
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
  const isLocationValid = (location) => /^[A-Za-z\s.]+,\s[A-Za-z\s]+$/.test(location);

  const handleUpdate = async () => {
    if (!isPhoneValid(user.phone) && user.phone !== '') {
      setPhoneError('Invalid phone number. Please enter in the format XXX-XXX-XXXX or leave blank');
      return;
    }
    if (!isLocationValid(user.location)) {
      setLocationError('Location is required. Format: City, State');
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

    if (Object.keys(updateFields).length === 0) {
      alert('No changes made.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:${port}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          phone_number: user.phone,
          location: user.location,
          profile_photo: user.image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      alert('Profile updated successfully');
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
          onClick={() => navigate('/profile')}
          sx={{
            color: 'white',
            backgroundColor: blue[500],
            '&:hover': {
              backgroundColor: blue[700],
            },
          }}
        >
          <ManageAccounts /> My Profile
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
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="Email"
          name="email"
          value={user.email}
          className="input-field"
          margin="normal"
          InputProps={{ readOnly: true }}
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
        <Button variant="contained" color="primary" onClick={handleUpdate} className="update-button">
          Update
        </Button>
      </Box>
    </Box>
  );
};

export default UserProfile;
