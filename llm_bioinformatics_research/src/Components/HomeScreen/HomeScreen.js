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

  const sendMessage = async (message) => {
    try {
      const response = await axios.post('http://localhost:5001/predict', { input: message });
      console.log("Response from server:", response.data);
      return { success: true, ...response.data };
    } catch (error) {
      console.error('Error while fetching the response:', error);
      return { success: false, message: 'Failed to get a response. Please try again.' };
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();  // Prevents new line in the input
      handleSend();  // Calls the send function
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
                onKeyDown={handleKeyDown}  // This enables Enter key submission
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
