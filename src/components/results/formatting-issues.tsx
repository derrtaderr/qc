import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Check } from "lucide-react"

interface FormattingIssuesProps {
  formatting: {
    fonts: {
      name: string;
      size: number;
      count: number;
    }[];
    lineAlignment: {
      misalignments: {
        page: number;
        line: number;
        offset: number;
      }[];
    };
    spacing: {
      inconsistencies: {
        page: number;
        location: { x: number; y: number };
        expected: number;
        actual: number;
      }[];
    };
    anomalies: {
      type: 'corruption' | 'repetition' | 'unknown';
      page: number;
      location: { x: number; y: number };
      description: string;
    }[];
  };
}

export function FormattingIssues({ formatting }: FormattingIssuesProps) {
  const [fixedIssues, setFixedIssues] = React.useState<Set<string>>(new Set())

  const handleFix = (id: string) => {
    setFixedIssues(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const totalIssues =
    formatting.lineAlignment.misalignments.length +
    formatting.spacing.inconsistencies.length +
    formatting.anomalies.length

  if (totalIssues === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No formatting issues found
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Font Analysis */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Font Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formatting.fonts.map((font, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{font.name || 'Unknown Font'}</div>
                  <div className="text-sm text-gray-500">
                    Size: {font.size}pt • Used {font.count} times
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Line Alignment Issues */}
      {formatting.lineAlignment.misalignments.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Line Alignment Issues</h3>
          <div className="space-y-4">
            {formatting.lineAlignment.misalignments.map((issue, index) => {
              const id = `alignment-${index}`
              if (fixedIssues.has(id)) return null

              return (
                <Card key={id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">
                          Misaligned Line on Page {issue.page}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Line {issue.line} is offset by {issue.offset}px
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFix(id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Fix
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Spacing Issues */}
      {formatting.spacing.inconsistencies.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Spacing Issues</h3>
          <div className="space-y-4">
            {formatting.spacing.inconsistencies.map((issue, index) => {
              const id = `spacing-${index}`
              if (fixedIssues.has(id)) return null

              return (
                <Card key={id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">
                          Inconsistent Spacing on Page {issue.page}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Expected {issue.expected}px, found {issue.actual}px at position ({issue.location.x}, {issue.location.y})
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFix(id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Fix
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Anomalies */}
      {formatting.anomalies.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Visual Anomalies</h3>
          <div className="space-y-4">
            {formatting.anomalies.map((anomaly, index) => {
              const id = `anomaly-${index}`
              if (fixedIssues.has(id)) return null

              return (
                <Card key={id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="font-medium">
                          {anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)} Detected
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {anomaly.description}
                        <div className="mt-1">
                          Location: Page {anomaly.page} at ({anomaly.location.x}, {anomaly.location.y})
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFix(id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Fix
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
} 