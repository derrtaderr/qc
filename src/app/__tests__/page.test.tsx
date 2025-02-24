import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Home', () => {
  it('renders the upload interface', () => {
    render(<Home />)
    
    // Check for main heading
    expect(screen.getByText('PDF QC Analyzer')).toBeInTheDocument()
    
    // Check for upload card
    expect(screen.getByText('Upload PDF')).toBeInTheDocument()
    expect(screen.getByText('Upload your PDF document for quality control analysis')).toBeInTheDocument()
    
    // Check for file upload elements
    expect(screen.getByText('Choose File')).toBeInTheDocument()
    expect(screen.getByText(/drag and drop your PDF here/)).toBeInTheDocument()
  })
}) 