import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { QCSettings } from '@/components/settings/interface'

interface SettingsState {
  settings: QCSettings;
  updateSettings: (settings: Partial<QCSettings>) => void;
  updateThreshold: (key: keyof QCSettings['thresholds'], value: number) => void;
  resetSettings: () => void;
}

const defaultSettings: QCSettings = {
  textQC: true,
  visualQC: true,
  thresholds: {
    fontSizeVariance: 1,
    lineAlignmentTolerance: 3,
    spacingTolerance: 2,
  },
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        })),
        
      updateThreshold: (key, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            thresholds: {
              ...state.settings.thresholds,
              [key]: value,
            },
          },
        })),
        
      resetSettings: () =>
        set(() => ({
          settings: defaultSettings,
        })),
    }),
    {
      name: 'qc-settings',
    }
  )
) 