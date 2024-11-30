import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, TextField, Grid, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import { Edit, Refresh, Upload, Send, OpenInFull } from '@mui/icons-material';
import './HomeScreen.css';
import { useNavigate } from 'react-router-dom';

/**
 * @file HomeScreen.js
 *
 * @description
 * This file defines the `HomeScreen` React component, which serves as the primary user interface for 
 * interacting with an AI model hosted on a backend server. The component features a chat interface where 
 * users can input text and receive AI-generated responses. It also includes panels for displaying 
 * associated links, API recommendations, and error detection outputs.
 *
 * @key_features
 * - **AI Chat Interface**: Allows users to send messages and receive AI-generated responses.
 * - **Dynamic Message Rendering**: Displays user and AI messages with scroll-to-view functionality.
 * - **Backend Integration**: Communicates with a HuggingFace model hosted on a server via an API.
 * - **Logout Confirmation**: Prompts the user to confirm before logging out.
 * - **Panels for Additional Outputs**: Includes sections for links, API recommendations, and error detection.
 * - **Custom Paper Component**: Reusable UI component for structured sections.
 *
 * @usage_instructions
 * 1. Import the component and render it in your application.
 *    `import HomeScreen from './HomeScreen';`
 * 2. Pass the `setIsLoggedIn` function as a prop to manage authentication state.
 * 3. Ensure the server configuration (`config.json`) includes the `backendPort`.
 * 4. Customize the styles using `HomeScreen.css` as needed.
 */

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
  const [isExpanded, setIsExpanded] = useState(false); // State to track input expansion
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

  const handleSend = async () => {
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) {
      setMessages(prev => [...prev, { type: 'ai', text: "Please enter some text to get a response." }]);
      return;
    }
    setMessages(prev => [...prev, { type: 'user', text: trimmedMessage }]);
    const response = await sendMessage(trimmedMessage);
    if (response.success) {
      setMessages(prev => [...prev, { type: 'ai', text: response.message }]);
    } else {
      setMessages(prev => [...prev, { type: 'ai', text: "Unsuccessful" }]);
    }
    setInputMessage('');
  };

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
      } else { 
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

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); 
      handleSend();  
    }
  };

  const toggleExpandInput = () => {
    setIsExpanded(prev => !prev);
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
              <IconButton aria-label="Expand" onClick={toggleExpandInput}>
                <OpenInFull />
              </IconButton>
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
      <Dialog open={isExpanded} onClose={toggleExpandInput} fullWidth maxWidth="md">
        <DialogTitle>Expanded Input</DialogTitle>
        <DialogContent>
          <TextField
            variant="outlined"
            placeholder="Type your message here..."
            fullWidth
            multiline
            rows={10}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleExpandInput} color="primary">Close</Button>
          <Button onClick={handleSend} color="secondary">Send</Button>
        </DialogActions>
      </Dialog>
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