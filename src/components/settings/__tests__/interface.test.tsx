import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsInterface } from '../interface'
import { useSettingsStore } from '@/lib/stores/settings'

// Mock the settings store
jest.mock('@/lib/stores/settings', () => ({
  useSettingsStore: jest.fn(),
}))

describe('SettingsInterface', () => {
  const mockSettings = {
    textQC: true,
    visualQC: true,
    thresholds: {
      fontSizeVariance: 1,
      lineAlignmentTolerance: 3,
      spacingTolerance: 2,
    },
  }

  const mockUpdateSettings = jest.fn()
  const mockUpdateThreshold = jest.fn()

  beforeEach(() => {
    (useSettingsStore as jest.Mock).mockReturnValue({
      settings: mockSettings,
      updateSettings: mockUpdateSettings,
      updateThreshold: mockUpdateThreshold,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders all settings controls', () => {
    render(<SettingsInterface />)
    
    expect(screen.getByText('Analysis Settings')).toBeInTheDocument()
    expect(screen.getByText('Text QC')).toBeInTheDocument()
    expect(screen.getByText('Visual QC')).toBeInTheDocument()
    expect(screen.getByText('Font Size Variance')).toBeInTheDocument()
    expect(screen.getByText('Line Alignment Tolerance')).toBeInTheDocument()
    expect(screen.getByText('Spacing Tolerance')).toBeInTheDocument()
  })

  it('toggles text QC setting', () => {
    render(<SettingsInterface />)
    
    const textQCSwitch = screen.getByRole('switch', { name: /Text QC/i })
    fireEvent.click(textQCSwitch)
    
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      textQC: false,
    })
  })

  it('toggles visual QC setting', () => {
    render(<SettingsInterface />)
    
    const visualQCSwitch = screen.getByRole('switch', { name: /Visual QC/i })
    fireEvent.click(visualQCSwitch)
    
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      visualQC: false,
    })
  })

  it('updates font size variance threshold', () => {
    render(<SettingsInterface />)
    
    const slider = screen.getByRole('slider', { name: /Font Size Variance/i })
    fireEvent.change(slider, { target: { value: '2' } })
    
    expect(mockUpdateThreshold).toHaveBeenCalledWith('fontSizeVariance', 2)
  })

  it('updates line alignment tolerance threshold', () => {
    render(<SettingsInterface />)
    
    const slider = screen.getByRole('slider', { name: /Line Alignment Tolerance/i })
    fireEvent.change(slider, { target: { value: '5' } })
    
    expect(mockUpdateThreshold).toHaveBeenCalledWith('lineAlignmentTolerance', 5)
  })

  it('updates spacing tolerance threshold', () => {
    render(<SettingsInterface />)
    
    const slider = screen.getByRole('slider', { name: /Spacing Tolerance/i })
    fireEvent.change(slider, { target: { value: '4' } })
    
    expect(mockUpdateThreshold).toHaveBeenCalledWith('spacingTolerance', 4)
  })

  it('hides formatting thresholds when visual QC is disabled', () => {
    (useSettingsStore as jest.Mock).mockReturnValue({
      settings: { ...mockSettings, visualQC: false },
      updateSettings: mockUpdateSettings,
      updateThreshold: mockUpdateThreshold,
    })

    render(<SettingsInterface />)
    
    expect(screen.queryByText('Formatting Thresholds')).not.toBeInTheDocument()
    expect(screen.queryByText('Font Size Variance')).not.toBeInTheDocument()
  })
}) 