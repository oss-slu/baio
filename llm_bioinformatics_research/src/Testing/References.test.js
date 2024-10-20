import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import References from '../References/References';

describe('References Component', () => {
  it('renders without crashing', () => {
    render(<References />);
    expect(screen.getByText('References')).toBeInTheDocument();
  });

  it('displays all references initially', () => {
    render(<References />);
    const bioinformaticsTitles = screen.getAllByText('Understanding Bioinformatics');
    expect(bioinformaticsTitles.length).toBeGreaterThan(0);
    const genomicsTitles = screen.getAllByText('Advanced Techniques in Genomics');
    expect(genomicsTitles.length).toBeGreaterThan(0);
  });

  it('filters references based on author', () => {
    render(<References />);
    const searchInput = screen.getByLabelText('Search References');
    fireEvent.change(searchInput, { target: { value: 'Smith' } });
    expect(screen.getByText('Understanding Bioinformatics')).toBeInTheDocument();
    expect(screen.queryByText('Advanced Techniques in Genomics')).not.toBeInTheDocument();
  });

  it('filters references based on title', () => {
    render(<References />);
    const searchInput = screen.getByLabelText('Search References');
    fireEvent.change(searchInput, { target: { value: 'Bioinformatics' } });
    expect(screen.getByText('Understanding Bioinformatics')).toBeInTheDocument();
    expect(screen.queryByText('Advanced Techniques in Genomics')).not.toBeInTheDocument();
  });

  it('filters references based on journal', () => {
    render(<References />);
    const searchInput = screen.getByLabelText('Search References');
    fireEvent.change(searchInput, { target: { value: 'Bioinformatics Journal' } });
    expect(screen.getByText('Understanding Bioinformatics')).toBeInTheDocument();
    expect(screen.queryByText('Advanced Techniques in Genomics')).not.toBeInTheDocument();
  });

  it('filters references based on volume', () => {
    render(<References />);
    const searchInput = screen.getByLabelText('Search References');
    fireEvent.change(searchInput, { target: { value: '15' } });
    expect(screen.getByText('Understanding Bioinformatics')).toBeInTheDocument();
    expect(screen.queryByText('Advanced Techniques in Genomics')).not.toBeInTheDocument();
  });

  it('filters references based on pages', () => {
    render(<References />);
    const searchInput = screen.getByLabelText('Search References');
    fireEvent.change(searchInput, { target: { value: '123-130' } });
    expect(screen.getByText('Understanding Bioinformatics')).toBeInTheDocument();
    expect(screen.queryByText('Advanced Techniques in Genomics')).not.toBeInTheDocument();
  });

  it('filters references based on link', () => {
    render(<References />);
    const searchInput = screen.getByLabelText('Search References');
    fireEvent.change(searchInput, { target: { value: 'PMC8738975' } });
    expect(screen.getByText('Understanding Bioinformatics')).toBeInTheDocument();
    expect(screen.queryByText('Advanced Techniques in Genomics')).not.toBeInTheDocument();
  });

  it('shows "No references found" when no references match the search input', () => {
    render(<References />);
    const searchInput = screen.getByLabelText('Search References');
    fireEvent.change(searchInput, { target: { value: 'Nonexistent Author' } });
    expect(screen.queryByText('No references found')).toBeInTheDocument();
  });

  it('expands Accordion to show full citation details', () => {
    render(<References />);
    const firstAccordion = screen.getByRole('button', { name: /Understanding Bioinformatics/i });
    fireEvent.click(firstAccordion);
    expect(screen.getByText((content, element) => content.includes('Bioinformatics Journal, 15, 123-130'))).toBeVisible();
  });

  it('filters references based on year', () => {
    render(<References />);
    const filterSelect = screen.getByLabelText('Filter by Year');
    fireEvent.mouseDown(filterSelect);
    fireEvent.click(screen.getByText('2021'));
    expect(screen.queryByText('Understanding Bioinformatics')).not.toBeInTheDocument();
    expect(screen.getByText('Advanced Techniques in Genomics')).toBeInTheDocument();
  });

  it('shows all references when selecting "All Years" after applying a filter', async () => {
    render(<References />);
    const filterSelect = screen.getByLabelText('Filter by Year');
    fireEvent.mouseDown(filterSelect);
    fireEvent.click(screen.getByText('2021'));
    fireEvent.mouseDown(screen.getByTestId('year-filter')); 
    fireEvent.click(screen.getByText('All Years')); 
    expect(screen.getByText('Understanding Bioinformatics')).toBeInTheDocument();
    expect(screen.getByText('Advanced Techniques in Genomics')).toBeInTheDocument();
  });
});
