import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import ApiDocumentation from '../ApiDocumentation/ApiDocumentation';


test('renders the API Documentation page and checks for the external link', () => {
    render(<ApiDocumentation />);

    expect(screen.getByText(/API Documentation/i)).toBeInTheDocument();
    
    const linkElement = screen.getByText(/Slack Authentication Documentation/i);
    expect(linkElement).toBeInTheDocument();

    expect(linkElement).toHaveAttribute('href', 'https://api.slack.com/authentication');


  });

test('renders the API Documentation page and checks for the search functionality', () => {
  render(<ApiDocumentation />);

  const searchInput = screen.getByLabelText(/Search APIs/i);
  expect(searchInput).toBeInTheDocument();

  fireEvent.change(searchInput, { target: { value: 'products' } });
  expect(screen.getByText(/Product API/i)).toBeInTheDocument();
  expect(screen.queryByText(/Authentication API/i)).toBeNull();
});

test('renders the API Documentation page and checks for the API details', () => {
  render(<ApiDocumentation />);

  expect(screen.getByText(/Product API/i)).toBeInTheDocument();
  expect(screen.getByText(/Fetch details about products, including prices and stock availability./i)).toBeInTheDocument();
  expect(screen.getByText(/Usage: Fetch details about products, including prices and stock availability./i)).toBeInTheDocument();
});

test('renders the API Documentation page and checks for the "No APIs found" message', () => {
  render(<ApiDocumentation />);

  const searchInput = screen.getByLabelText(/Search APIs/i);
  fireEvent.change(searchInput, { target: { value: 'random' } });
  expect(screen.getByText(/No APIs found/i)).toBeInTheDocument();
});


