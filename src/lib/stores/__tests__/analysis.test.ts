import { useAnalysisStore } from '../analysis'

describe('Analysis Store', () => {
  beforeEach(() => {
    useAnalysisStore.setState({
      steps: [],
      currentStep: '',
      overallProgress: 0,
      status: 'idle',
    })
  })

  it('initializes with default state', () => {
    const state = useAnalysisStore.getState()
    expect(state.steps.length).toBe(4)
    expect(state.currentStep).toBe('')
    expect(state.overallProgress).toBe(0)
    expect(state.status).toBe('idle')
    expect(state.error).toBeUndefined()
  })

  it('updates step status and progress', () => {
    const store = useAnalysisStore.getState()
    store.setStep('text-extraction', {
      status: 'processing',
      progress: 50,
    })

    const state = useAnalysisStore.getState()
    const updatedStep = state.steps.find(step => step.id === 'text-extraction')
    expect(updatedStep?.status).toBe('processing')
    expect(updatedStep?.progress).toBe(50)
  })

  it('sets current step and updates statuses', () => {
    const store = useAnalysisStore.getState()
    store.setCurrentStep('ocr-processing')

    const state = useAnalysisStore.getState()
    expect(state.currentStep).toBe('ocr-processing')
    expect(state.steps.find(step => step.id === 'ocr-processing')?.status).toBe('processing')
  })

  it('updates overall progress', () => {
    const store = useAnalysisStore.getState()
    store.setOverallProgress(75)

    const state = useAnalysisStore.getState()
    expect(state.overallProgress).toBe(75)
  })

  it('sets status and error message', () => {
    const store = useAnalysisStore.getState()
    store.setStatus('error', 'Something went wrong')

    const state = useAnalysisStore.getState()
    expect(state.status).toBe('error')
    expect(state.error).toBe('Something went wrong')
  })

  it('resets state to initial values', () => {
    const store = useAnalysisStore.getState()
    
    // Set some values
    store.setCurrentStep('ocr-processing')
    store.setOverallProgress(50)
    store.setStatus('processing')
    
    // Reset
    store.reset()
    
    const state = useAnalysisStore.getState()
    expect(state.steps.length).toBe(4)
    expect(state.currentStep).toBe('')
    expect(state.overallProgress).toBe(0)
    expect(state.status).toBe('idle')
    expect(state.error).toBeUndefined()
  })
}) 