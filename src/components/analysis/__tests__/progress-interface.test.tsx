import { render, screen, fireEvent } from '@testing-library/react'
import { AnalysisProgressInterface } from '../progress-interface'

describe('AnalysisProgressInterface', () => {
  const mockSteps = [
    {
      id: '1',
      name: 'Text Extraction',
      status: 'completed' as const,
      progress: 100,
    },
    {
      id: '2',
      name: 'OCR Processing',
      status: 'processing' as const,
      progress: 50,
    },
    {
      id: '3',
      name: 'Visual Analysis',
      status: 'pending' as const,
      progress: 0,
    },
  ]

  const defaultProps = {
    steps: mockSteps,
    currentStep: 'OCR Processing',
    overallProgress: 45,
    status: 'processing' as const,
  }

  it('renders all steps with correct status indicators', () => {
    render(<AnalysisProgressInterface {...defaultProps} />)

    expect(screen.getByText('Text Extraction')).toBeInTheDocument()
    expect(screen.getByText('OCR Processing')).toBeInTheDocument()
    expect(screen.getByText('Visual Analysis')).toBeInTheDocument()

    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('displays overall progress correctly', () => {
    render(<AnalysisProgressInterface {...defaultProps} />)
    expect(screen.getByText('Analysis Progress')).toBeInTheDocument()
  })

  it('shows error message when provided', () => {
    const error = 'An error occurred during processing'
    render(<AnalysisProgressInterface {...defaultProps} error={error} />)
    expect(screen.getByText(error)).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn()
    render(<AnalysisProgressInterface {...defaultProps} onCancel={onCancel} />)
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(onCancel).toHaveBeenCalled()
  })
}) 