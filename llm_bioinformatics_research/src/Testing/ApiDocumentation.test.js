/*

API Documentation Page Testing:

This file tests the functionality of the API documentation page: 
~ tests for the rendering of the page
~ tests for API details
~ tests for external links
~ tests for search functionality
~ tests for error message prompting

*/

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import APIDocumentation from '../Components/APIDocumentation/APIDocumentation';


test('renders the API Documentation page and checks for the external link', () => {
    render(<APIDocumentation />);

    expect(screen.getByText(/API Documentation/i)).toBeInTheDocument();
    
    const linkElement = screen.getByText(/Slack Authentication Documentation/i);
    expect(linkElement).toBeInTheDocument();

    expect(linkElement).toHaveAttribute('href', 'https://api.slack.com/authentication');


  });

test('renders the API Documentation page and checks for the search functionality', () => {
  render(<APIDocumentation />);

  const searchInput = screen.getByLabelText(/Search APIs/i);
  expect(searchInput).toBeInTheDocument();

  fireEvent.change(searchInput, { target: { value: 'products' } });
  expect(screen.getByText(/Product API/i)).toBeInTheDocument();
  expect(screen.queryByText(/Authentication API/i)).toBeNull();
});

test('renders the API Documentation page and checks for the API details', () => {
  render(<APIDocumentation />);

  expect(screen.getByText(/Product API/i)).toBeInTheDocument();
  expect(screen.getByText(/Fetch details about products, including prices and stock availability./i)).toBeInTheDocument();
  expect(screen.getByText(/Usage: Fetch details about products, including prices and stock availability./i)).toBeInTheDocument();
});

test('renders the API Documentation page and checks for the "No APIs found" message', () => {
  render(<APIDocumentation />);

  const searchInput = screen.getByLabelText(/Search APIs/i);
  fireEvent.change(searchInput, { target: { value: 'random' } });
  expect(screen.getByText(/No APIs found/i)).toBeInTheDocument();
});


