import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Button, Container, Typography, AppBar, Toolbar, Tabs, Tab } from '@mui/material';
import ApiDocumentation from './ApiDocumentation';
import References from './References';

function HomePage() {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Enhancing Bioinformatics Research through LLM-Based API Recommendation and Error Detection
      </Typography>
      <Button component={Link} to="/api-documentation" variant="contained" color="primary">
        Go to API Documentation
      </Button>
      <Button component={Link} to="/references" variant="contained" color="secondary" style={{ marginLeft: '16px' }}>
        Go to References
      </Button>
    </Container>
  );
}

function App() {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Tabs>
            <Tab label="Home" component={Link} to="/" />
            <Tab label="API Documentation" component={Link} to="/api-documentation" />
            <Tab label="References" component={Link} to="/references" />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container style={{ marginTop: '20px' }}>
        <Routes>
          <Route path="/api-documentation" element={<ApiDocumentation />} />
          <Route path="/references" element={<References />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
