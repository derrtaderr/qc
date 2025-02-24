import * as React from "react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useSettingsStore } from "@/lib/stores/settings"

export interface QCSettings {
  textQC: boolean;
  visualQC: boolean;
  thresholds: {
    fontSizeVariance: number;
    lineAlignmentTolerance: number;
    spacingTolerance: number;
  };
}

export function SettingsInterface() {
  const { settings, updateSettings, updateThreshold } = useSettingsStore()

  const handleToggleChange = (key: keyof Pick<QCSettings, 'textQC' | 'visualQC'>) => {
    updateSettings({
      [key]: !settings[key],
    })
  }

  const handleThresholdChange = (
    key: keyof QCSettings['thresholds'],
    value: number
  ) => {
    updateThreshold(key, value)
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Analysis Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="textQC" className="flex flex-col">
              <span>Text QC</span>
              <span className="text-sm text-gray-500">
                Check spelling, grammar, and style
              </span>
            </Label>
            <Switch
              id="textQC"
              checked={settings.textQC}
              onCheckedChange={() => handleToggleChange('textQC')}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="visualQC" className="flex flex-col">
              <span>Visual QC</span>
              <span className="text-sm text-gray-500">
                Check fonts, alignment, and spacing
              </span>
            </Label>
            <Switch
              id="visualQC"
              checked={settings.visualQC}
              onCheckedChange={() => handleToggleChange('visualQC')}
            />
          </div>
        </div>
      </div>

      {settings.visualQC && (
        <div>
          <h3 className="text-md font-semibold mb-4">Formatting Thresholds</h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="fontSizeVariance">Font Size Variance</Label>
                <span className="text-sm text-gray-500">
                  {settings.thresholds.fontSizeVariance}pt
                </span>
              </div>
              <Slider
                id="fontSizeVariance"
                min={0}
                max={5}
                step={0.5}
                value={[settings.thresholds.fontSizeVariance]}
                onValueChange={([value]) =>
                  handleThresholdChange('fontSizeVariance', value)
                }
              />
              <span className="text-xs text-gray-500">
                Allowed difference in font sizes
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="lineAlignmentTolerance">Line Alignment Tolerance</Label>
                <span className="text-sm text-gray-500">
                  {settings.thresholds.lineAlignmentTolerance}px
                </span>
              </div>
              <Slider
                id="lineAlignmentTolerance"
                min={0}
                max={10}
                step={1}
                value={[settings.thresholds.lineAlignmentTolerance]}
                onValueChange={([value]) =>
                  handleThresholdChange('lineAlignmentTolerance', value)
                }
              />
              <span className="text-xs text-gray-500">
                Maximum allowed line misalignment
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="spacingTolerance">Spacing Tolerance</Label>
                <span className="text-sm text-gray-500">
                  {settings.thresholds.spacingTolerance}px
                </span>
              </div>
              <Slider
                id="spacingTolerance"
                min={0}
                max={10}
                step={1}
                value={[settings.thresholds.spacingTolerance]}
                onValueChange={([value]) =>
                  handleThresholdChange('spacingTolerance', value)
                }
              />
              <span className="text-xs text-gray-500">
                Allowed variation in spacing
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
} 