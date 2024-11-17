import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, TextField, Grid, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import { Edit, Refresh, Upload, Send } from '@mui/icons-material';
import './HomeScreen.css';
import { useNavigate } from 'react-router-dom';

const CustomPaper = ({ children, title }) => (
  <Paper elevation={3} className="custom-paper">
    {title && <Typography variant="h6">{title}</Typography>}
    {children}
  </Paper>
);

function HomeScreen({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [config, setConfig] = useState(null);
  const [backendUrl, setBackendUrl] = useState('');

  useEffect(() => {
    window.history.pushState(null, document.title, window.location.href);
    const handlePopState = (event) => {
      event.preventDefault();
      setOpenDialog(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleConfirmLogout = () => {
    setIsLoggedIn(false);
    setOpenDialog(false);
    navigate('/login', { replace: true });
  };

  const handleCancelLogout = () => {
    setOpenDialog(false);
    window.history.pushState(null, document.title, window.location.href);
  };

  // finds URL for the backend server hosting the HuggingFace model
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/config.json');
        if (!response.ok) throw new Error('Failed to fetch config.json');
        const configData = await response.json();
  
        setConfig(configData);
        const backendUrl = `http://localhost:${configData.backendPort}`;
        setBackendUrl(backendUrl);
        console.log('Backend URL:', backendUrl);
      } catch (error) {
        console.error('Error fetching config.json:', error);
        alert('Failed to load configuration. Please try refreshing the page.');
      }
    };
  
    fetchConfig();
  }, [])

  // updates chat history 
  const handleSend = async () => {
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) return;
    setMessages(prev => [...prev, { type: 'user', text: trimmedMessage }]);
    const response = await sendMessage(trimmedMessage);
    if (response.success) {
      setMessages(prev => [...prev, { type: 'ai', text: "Successful input" }]);
    } else {
      setMessages(prev => [...prev, { type: 'ai', text: response.message }]);
    }
    setInputMessage('');
  };

  // sends input to model and retrieves response
  const sendMessage = async (message) => {
    if (!backendUrl) {
      console.error('Backend URL not set yet!');
      return { success: false, message: 'Backend URL is not configured. Please try again later.' };
    }

    try {
      const response = await axios.post(`${backendUrl}/predict`, { input: message });
      console.log("Response from server:", response.data);

      if (response && response.data && response.data.success) { 
        return { success: true, message: response.data.output || 'No output provided by the server.' }
      } else { // Updated line
        return { success: false, message: response.data?.message || 'Unexpected server response.' };
      }
    } catch (error) {
      console.error('Error while fetching the response:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to get a response. Please try again.' 
      }; 
    }
  };

  // allows the user to submit input with 'enter' key
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); 
      handleSend();  
    }
  };

  return (
    <Box className="home-screen">
      <Grid container spacing={2} sx={{ flexGrow: 1, p: 1 }}>
        <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CustomPaper title="AI Chat and Response" sx={{ flexGrow: 1 }}>
            <Box className="ai-output">
              {messages.map((msg, index) => (
                <Typography key={index} className={`message ${msg.type}`} ref={index === messages.length - 1 ? messagesEndRef : null}>
                  {msg.type === 'user' ? `${msg.text}` : `${msg.text}`}
                </Typography>
              ))}
            </Box>
            <Box className="input-actions">
              <TextField
                variant="outlined"
                placeholder="Text Input"
                fullWidth
                className="text-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <IconButton aria-label="Send" onClick={handleSend}><Send /></IconButton>
            </Box>
          </CustomPaper>
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', height: '95%' }}>
          <Grid container spacing={5} sx={{ flexGrow: 1 }}>
            <Grid item xs={12} sx={{ flexGrow: 1 }}>
              <CustomPaper title="Associated Links for the generated chat">
                <Box className="panel-content">
                  <Typography className="output-text">Links Output</Typography>
                </Box>
              </CustomPaper>
            </Grid>
            <Grid item xs={12} sx={{ flexGrow: 1 }}>
              <CustomPaper title="API Recommendation Panel">
                <Box className="panel-content">
                  <Typography className="output-text">API Recommendations Output</Typography>
                </Box>
              </CustomPaper>
            </Grid>
            <Grid item xs={12} sx={{ flexGrow: 1 }}>
              <CustomPaper title="Error detection Panel">
                <Box className="panel-content">
                  <Typography className="output-text">Error detection Output</Typography>
                </Box>
              </CustomPaper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Dialog open={openDialog} onClose={handleCancelLogout} aria-labelledby="logout-dialog-title" aria-describedby="logout-dialog-description">
        <DialogTitle id="logout-dialog-title">{"Confirm Logout"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            Are you sure you want to log out?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelLogout} color="primary">Cancel</Button>
          <Button onClick={handleConfirmLogout} color="secondary" autoFocus>Logout</Button>
        </DialogActions>
      </Dialog>
      <Box className="footer">
        <Typography variant="body1">Footer</Typography>
      </Box>
    </Box>
  );
}

export default HomeScreen;
