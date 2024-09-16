import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Paper } from '@mui/material';

const references = [
  {
    author: "Smith, J.",
    year: "2022",
    title: "Understanding Bioinformatics",
    journal: "Bioinformatics Journal",
    volume: "15",
    pages: "123-130",
    link: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8738975/"
  },
  {
    author: "Doe, A.",
    year: "2021",
    title: "Advanced Techniques in Genomics",
    journal: "Genomics Review",
    volume: "22",
    pages: "45-60",
    link: "https://www.sciencedirect.com/science/article/pii/S0168952519301126" 
  }
];

function References() {
  const navigate = useNavigate();

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        References
      </Typography>
      <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
        <ul>
          {references.map((ref, index) => (
            <li key={index}>
              {ref.author} ({ref.year}). <a href={ref.link} target="_blank" rel="noopener noreferrer">{ref.title}</a>. {ref.journal}, {ref.volume}, {ref.pages}.
            </li>
          ))}
        </ul>
      </Paper>
      <Button variant="contained" color="primary" onClick={() => navigate('/')}>
        Back to Home
      </Button>
    </Container>
  );
}

export default References;
