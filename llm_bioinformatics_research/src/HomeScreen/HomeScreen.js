import React from 'react';
import { Container, Box, Typography, Paper, TextField, Grid, IconButton } from '@mui/material';
import { grey } from '@mui/material/colors';
import { Edit, Refresh, Upload, Send} from '@mui/icons-material';

const CustomPaper = ({ children, title, height }) => (
  <Paper
    elevation={3}
    sx={{
      p: 2,
      bgcolor: grey[300],
      border: '1px solid',
      borderColor: grey[400],
      height: height || 'auto',
      display: 'flex',
      flexDirection: 'column',
      flexGrow: height ? 1 : 0,
    }}
  >
    {title && <Typography variant="h6">{title}</Typography>}
    {children}
  </Paper>
);

const ReadOnlyTextField = ({ placeholder, rows }) => (
  <TextField
    fullWidth
    multiline
    rows={rows}
    variant="outlined"
    placeholder={placeholder}
    sx={{ mt: 2, flexGrow: 1, overflowY: 'auto' }}
    InputProps={{
      readOnly: true,
    }}
  />
);


function HomeScreen() {
  return (
    <>
      <Container maxWidth={false} sx={{ mt: 2, mb: 2, minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/*AI Chat and Response */}
        <Grid container spacing={1} sx={{ flexGrow: 1 }}> 
          <Grid item xs={12} md={8}>
            <CustomPaper title="AI Chat and Response" height="525px">
              <ReadOnlyTextField placeholder="AI Output" rows={16} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3 }}>
              <IconButton aria-label="Edit"><Edit /></IconButton>
              <IconButton aria-label="Refresh"><Refresh /></IconButton>
              </Box>
            </CustomPaper>
          </Grid>

          {/* Associated Links and API Recommendation */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            <CustomPaper title="Associated Links for the generated chat" height="300px">
              <ReadOnlyTextField placeholder="Links Output" rows={8} />
            </CustomPaper>

            <CustomPaper title="API Recommendation Panel">
              <ReadOnlyTextField placeholder="API Recommendations Output" rows={4} />
            </CustomPaper>
          </Grid>
        </Grid>

        {/* Text Input and Error Detection */}
        <Grid container spacing={1} sx={{ mt: 0 }}>
          <Grid item xs={12} md={8}>
            <CustomPaper height="auto">
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <IconButton aria-label='Upload'><Upload /></IconButton>
                <TextField fullWidth placeholder="Text Input" variant="outlined" sx={{ mx: 1 }} />
                <IconButton aria-label="Send"><Send /></IconButton>
              </Box>
            </CustomPaper>
          </Grid>

          <Grid item xs={12} md={4}>
            <CustomPaper title="Error detection" height="55px" />
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          p: 2,
          bgcolor: grey[200],
          mt: 'auto',
          textAlign: 'center',
        }}
      >
        <Typography>Footer</Typography>
      </Box>
    </>
  );
}

export default HomeScreen;
