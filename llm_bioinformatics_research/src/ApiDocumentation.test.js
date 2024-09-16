import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import ApiDocumentation from './ApiDocumentation';

// Helper component to wrap ApiDocumentation with Router
const renderWithRouter = (ui) => {
  return render(<Router>{ui}</Router>);
};


test('renders the API Documentation page and checks for the external link', () => {
    renderWithRouter(<ApiDocumentation />);

    // Check if the title and content are rendered
    expect(screen.getByText(/API Documentation/i)).toBeInTheDocument();
    expect(screen.getByText(/API Name/i)).toBeInTheDocument();
    
    // Check if the external link is rendered
    const linkElement = screen.getByText(/Slack Authentication Documentation/i);
    expect(linkElement).toBeInTheDocument();

    // Check if the link has the correct href attribute
    expect(linkElement).toHaveAttribute('href', 'https://api.slack.com/authentication');


  });


