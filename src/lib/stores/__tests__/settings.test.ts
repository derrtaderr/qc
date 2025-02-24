import { useSettingsStore } from '../settings'

describe('Settings Store', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: {
        textQC: true,
        visualQC: true,
        thresholds: {
          fontSizeVariance: 1,
          lineAlignmentTolerance: 3,
          spacingTolerance: 2,
        },
      },
    })
  })

  it('initializes with default settings', () => {
    const state = useSettingsStore.getState()
    expect(state.settings.textQC).toBe(true)
    expect(state.settings.visualQC).toBe(true)
    expect(state.settings.thresholds.fontSizeVariance).toBe(1)
    expect(state.settings.thresholds.lineAlignmentTolerance).toBe(3)
    expect(state.settings.thresholds.spacingTolerance).toBe(2)
  })

  it('updates settings', () => {
    const store = useSettingsStore.getState()
    store.updateSettings({
      textQC: false,
      visualQC: false,
    })

    const state = useSettingsStore.getState()
    expect(state.settings.textQC).toBe(false)
    expect(state.settings.visualQC).toBe(false)
    // Thresholds should remain unchanged
    expect(state.settings.thresholds.fontSizeVariance).toBe(1)
  })

  it('updates threshold values', () => {
    const store = useSettingsStore.getState()
    store.updateThreshold('fontSizeVariance', 2)

    const state = useSettingsStore.getState()
    expect(state.settings.thresholds.fontSizeVariance).toBe(2)
    // Other thresholds should remain unchanged
    expect(state.settings.thresholds.lineAlignmentTolerance).toBe(3)
    expect(state.settings.thresholds.spacingTolerance).toBe(2)
  })

  it('resets settings to default values', () => {
    const store = useSettingsStore.getState()
    
    // Change some settings
    store.updateSettings({
      textQC: false,
      visualQC: false,
    })
    store.updateThreshold('fontSizeVariance', 5)
    
    // Reset
    store.resetSettings()
    
    const state = useSettingsStore.getState()
    expect(state.settings.textQC).toBe(true)
    expect(state.settings.visualQC).toBe(true)
    expect(state.settings.thresholds.fontSizeVariance).toBe(1)
    expect(state.settings.thresholds.lineAlignmentTolerance).toBe(3)
    expect(state.settings.thresholds.spacingTolerance).toBe(2)
  })
}) 