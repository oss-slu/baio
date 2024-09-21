import React from 'react';
import {Container, Typography, Paper, TextField } from '@mui/material';

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

  const [searchQuery, setSearchQuery] = React.useState('');
  const filteredReferences = references.filter((ref) => {
    return ref.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.journal.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        References
      </Typography>
      <TextField
        label="Search References"
        variant="outlined"
        fullWidth
        style={{ marginBottom: '20px' }} 
        margin='normal'
        color='primary'
        onChange={(e) => setSearchQuery(e.target.value)}
      />  
      <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
        <ul>
    
          {filteredReferences.length > 0 ? (
            filteredReferences.map((ref, index) => (
              <li key={index}>
                {ref.author} ({ref.year}). <a href={ref.link} target="_blank" rel="noopener noreferrer">{ref.title}</a>. {ref.journal}, {ref.volume}, {ref.pages}.
              </li>
            ))
          ) : (
            <Typography>No references found</Typography>
          )}
        </ul>
      </Paper>
    </Container>
  );
}

export default References;
