import React, { useEffect } from 'react';
import { Box, Typography, Paper, TextField, Grid, IconButton } from '@mui/material';
import { Edit, Refresh, Upload, Send } from '@mui/icons-material';
import './HomeScreen.css'; 
import { useNavigate } from 'react-router-dom';

const CustomPaper = ({ children, title }) => (
  <Paper
    elevation={3}
    className="custom-paper"
  >
    {title && <Typography variant="h6">{title}</Typography>}
    {children}
  </Paper>
);

function HomeScreen ({ setIsLoggedIn }) {

  const navigate = useNavigate();

  useEffect(() => {
    const handleBackNavigation = (event) => {
      event.preventDefault();
      const confirmLogout = window.confirm("Confirm Logout?");
      if (confirmLogout) {
        setIsLoggedIn(false);
        navigate('/login', { replace: true }); 
      }
    };

    window.addEventListener('popstate', handleBackNavigation);
    return () => window.removeEventListener('popstate', handleBackNavigation);
  }, [navigate, setIsLoggedIn]);

  return (
    <Box className="home-screen">
      <Grid container spacing={2} sx={{ flexGrow: 1, p: 1 }}>
        <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CustomPaper title="AI Chat and Response" sx={{ flexGrow: 1 }}>
            {/* AI Output */}
            <Box className="ai-output">
              <Typography className="output-text">AI Output</Typography>
            </Box>

            {/* Edit and Refresh Buttons */}
            <Box className="button-container">
              <IconButton aria-label="Edit" className="icon-button"><Edit /></IconButton>
              <IconButton aria-label="Refresh" className="icon-button"><Refresh /></IconButton>
            </Box>

            {/* Text Input and Actions */}
            <Box className="input-actions">
              <IconButton aria-label='Upload'><Upload /></IconButton>
              <TextField variant="outlined" placeholder="Text Input" fullWidth className="text-input" />
              <IconButton aria-label="Send"><Send /></IconButton>
            </Box>
          </CustomPaper>
        </Grid>

        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', height: '95%' }}>
          <Grid container spacing= {5} sx={{ flexGrow: 1}}>
            {/* Associated Links Panel */}
            <Grid item xs={12} sx={{ flexGrow: 1 }}>
              <CustomPaper title="Associated Links for the generated chat">
                <Box className="panel-content">
                  <Typography className="output-text">Links Output</Typography>
                </Box>
              </CustomPaper>
            </Grid>

            {/* API Recommendation Panel */}
            <Grid item xs={12} sx={{ flexGrow: 1 }}>
              <CustomPaper title="API Recommendation Panel">
                <Box className="panel-content">
                  <Typography className="output-text">
                    API Recommendations Output
                  </Typography>
                </Box>
              </CustomPaper>
            </Grid>

            {/* Error Detection Panel */}
            <Grid item xs={12} sx={{ flexGrow: 1 }}>
              <CustomPaper title="Error detection Panel" className="error-detection">
                <Box className="panel-content">
                  <Typography className="output-text">Error detection Output</Typography>
                </Box>
              </CustomPaper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box className="footer">
        <Typography variant="body1">Footer</Typography>
      </Box>
    </Box>
  );
};

export default HomeScreen;
