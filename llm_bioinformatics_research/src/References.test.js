import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import References from './References'; 

// A helper component to wrap References with Router
const renderWithRouter = (ui) => {
  return render(<Router>{ui}</Router>);
};

test('renders references with links and checks "Back to Home" button', () => {
  renderWithRouter(<References />);

  // Check if the references are rendered
  expect(screen.getByText(/Understanding Bioinformatics/i)).toBeInTheDocument();
  expect(screen.getByText(/Advanced Techniques in Genomics/i)).toBeInTheDocument();

  // Check if the links are present
  const bioinformaticsLink = screen.getByText(/Understanding Bioinformatics/i);
  expect(bioinformaticsLink).toHaveAttribute('href', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8738975/');
  
  const genomicsLink = screen.getByText(/Advanced Techniques in Genomics/i);
  expect(genomicsLink).toHaveAttribute('href', 'https://www.sciencedirect.com/science/article/pii/S0168952519301126');

  // Check if the "Back to Home" button is present and clickable
  const backButton = screen.getByRole('button', { name: /Back to Home/i });
  expect(backButton).toBeInTheDocument();

  // Simulate button click
  fireEvent.click(backButton);
  
});
