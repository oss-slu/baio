import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import References from '../References/References';


/* const render = (ui) => {
  return render(<Router>{ui}</Router>);
}; */

test('renders references with links', () => {
  render(<References />);

  expect(screen.getByText(/Understanding Bioinformatics/i)).toBeInTheDocument();
  expect(screen.getByText(/Advanced Techniques in Genomics/i)).toBeInTheDocument();

  const bioinformaticsLink = screen.getByText(/Understanding Bioinformatics/i);
  expect(bioinformaticsLink).toHaveAttribute('href', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8738975/');
  
  const genomicsLink = screen.getByText(/Advanced Techniques in Genomics/i);
  expect(genomicsLink).toHaveAttribute('href', 'https://www.sciencedirect.com/science/article/pii/S0168952519301126');
});

test('renders references and checks for the search functionality', () => {
  render(<References />);

  const searchInput = screen.getByLabelText(/Search References/i);
  expect(searchInput).toBeInTheDocument();

  fireEvent.change(searchInput, { target: { value: 'Smith' } });
  expect(screen.getByText(/Smith, J./i)).toBeInTheDocument();
  expect(screen.queryByText(/Doe, A./i)).toBeNull();
});

test('renders references and checks for the "No references found" message', () => {
  render(<References />);

 
  const searchInput = screen.getByLabelText(/Search References/i);
  fireEvent.change(searchInput, { target: { value: 'random' } });
  expect(screen.getByText(/No references found/i)).toBeInTheDocument();
});

test('renders references and checks for the reference details', () => {
  render(<References />);

  expect(screen.getByText(/Smith, J./i)).toBeInTheDocument();
  expect(screen.getByText(/2022/i)).toBeInTheDocument();
  expect(screen.getByText(/Understanding Bioinformatics/i)).toBeInTheDocument();
  expect(screen.getByText(/Bioinformatics Journal/i)).toBeInTheDocument();
  expect(screen.getByText(/15/i)).toBeInTheDocument();
  expect(screen.getByText(/123-130/i)).toBeInTheDocument();
  expect(screen.getByText(/Doe, A./i)).toBeInTheDocument();
  expect(screen.getByText(/2021/i)).toBeInTheDocument();
  expect(screen.getByText(/Advanced Techniques in Genomics/i)).toBeInTheDocument();
  expect(screen.getByText(/Genomics Review/i)).toBeInTheDocument();
  expect(screen.getByText(/ 22/i)).toBeInTheDocument();
  expect(screen.getByText(/45-60/i)).toBeInTheDocument();
});

test('renders references and checks if Home button functons correctly', () => {
  render(<References />);

  const homeButton = screen.getByText(/HOME/i);
  expect(homeButton).toBeInTheDocument();
  fireEvent.click(homeButton);
  expect(screen.getByText(/Enhancing Bioinformatics Research through LLM-Based API/i)).toBeInTheDocument();
});