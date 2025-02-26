"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Check, FileText, Ruler, ArrowRight, Maximize } from "lucide-react"

interface FormattingIssuesProps {
  formatting: {
    fonts?: {
      name: string;
      size: number;
      count: number;
    }[];
    lineAlignment?: {
      misalignments: {
        page: number;
        line: number;
        offset: number;
        section?: string;
        content?: string;
        coordinates?: { x1: number; y1: number; x2: number; y2: number };
      }[];
    };
    spacing?: {
      inconsistencies: {
        page: number;
        location: { x: number; y: number };
        expected: number;
        actual: number;
        context?: string;
        elementType?: string;
      }[];
    };
    anomalies?: {
      type: 'corruption' | 'repetition' | 'unknown';
      page: number;
      location: { x: number; y: number };
      description: string;
      affectedArea?: { width: number; height: number };
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
    (formatting?.lineAlignment?.misalignments?.length || 0) +
    (formatting?.spacing?.inconsistencies?.length || 0) +
    (formatting?.anomalies?.length || 0)

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
      {formatting?.fonts && formatting.fonts.length > 0 && (
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
      )}

      {/* Line Alignment Issues */}
      {formatting?.lineAlignment?.misalignments && formatting.lineAlignment.misalignments.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Line Alignment Issues</h3>
          <div className="space-y-4">
            {formatting.lineAlignment.misalignments.map((issue, index) => {
              const id = `alignment-${index}`
              if (fixedIssues.has(id)) return null

              return (
                <Card key={id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="w-full">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">
                          Misaligned Line on Page {issue.page}
                        </span>
                      </div>
                      
                      {/* Location details */}
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <div className="flex items-center mr-3">
                          <FileText className="h-3 w-3 mr-1" />
                          <span>Page {issue.page}</span>
                        </div>
                        <div className="flex items-center mr-3">
                          <Ruler className="h-3 w-3 mr-1" />
                          <span>Line {issue.line}</span>
                        </div>
                        {issue.section && (
                          <div className="flex items-center">
                            <span>Section: {issue.section}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Issue details */}
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100">
                        <div className="flex items-center mb-2">
                          <span className="font-medium">Offset: </span>
                          <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 rounded text-yellow-800 font-mono">{issue.offset}px</span>
                        </div>
                        
                        {issue.coordinates && (
                          <div className="flex items-center mb-2">
                            <span className="font-medium">Coordinates: </span>
                            <span className="ml-1 font-mono text-xs">
                              ({issue.coordinates.x1}, {issue.coordinates.y1}) to ({issue.coordinates.x2}, {issue.coordinates.y2})
                            </span>
                          </div>
                        )}
                        
                        {issue.content && (
                          <div className="mt-2 border-t border-gray-100 pt-2">
                            <span className="font-medium block mb-1">Content:</span>
                            <span className="font-mono text-xs block">{issue.content}</span>
                          </div>
                        )}
                        
                        {/* Visual representation */}
                        <div className="mt-3 h-6 w-full bg-white border border-gray-200 rounded relative">
                          <div className="absolute top-0 left-0 h-full w-1/2 border-r border-dashed border-gray-300"></div>
                          <div 
                            className="absolute top-0 h-full bg-yellow-200 border-r border-yellow-400" 
                            style={{ 
                              left: '50%', 
                              width: `${Math.min(Math.abs(issue.offset) * 5, 50)}%`,
                              transform: issue.offset > 0 ? 'none' : 'translateX(-100%)'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFix(id)}
                      className="ml-4"
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
      {formatting?.spacing?.inconsistencies && formatting.spacing.inconsistencies.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Spacing Issues</h3>
          <div className="space-y-4">
            {formatting.spacing.inconsistencies.map((issue, index) => {
              const id = `spacing-${index}`
              if (fixedIssues.has(id)) return null

              return (
                <Card key={id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="w-full">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">
                          Inconsistent Spacing on Page {issue.page}
                        </span>
                      </div>
                      
                      {/* Location details */}
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <div className="flex items-center mr-3">
                          <FileText className="h-3 w-3 mr-1" />
                          <span>Page {issue.page}</span>
                        </div>
                        {issue.elementType && (
                          <div className="flex items-center mr-3">
                            <span>Element: {issue.elementType}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Maximize className="h-3 w-3 mr-1" />
                          <span>Position: ({issue.location.x}, {issue.location.y})</span>
                        </div>
                      </div>
                      
                      {/* Issue details */}
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100">
                        <div className="flex items-center mb-2">
                          <span className="font-medium">Expected: </span>
                          <span className="ml-1 px-1.5 py-0.5 bg-green-100 rounded text-green-800 font-mono">{issue.expected}px</span>
                          <ArrowRight className="mx-2 h-3 w-3" />
                          <span className="font-medium">Actual: </span>
                          <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 rounded text-yellow-800 font-mono">{issue.actual}px</span>
                          <span className="ml-2 text-xs">
                            ({issue.actual > issue.expected ? '+' : ''}{issue.actual - issue.expected}px difference)
                          </span>
                        </div>
                        
                        {issue.context && (
                          <div className="mt-2 border-t border-gray-100 pt-2">
                            <span className="font-medium block mb-1">Context:</span>
                            <span className="font-mono text-xs block">{issue.context}</span>
                          </div>
                        )}
                        
                        {/* Visual representation */}
                        <div className="mt-3 flex items-center">
                          <div className="h-6 bg-green-100 border border-green-200 rounded" style={{ width: `${issue.expected * 2}px` }}></div>
                          <span className="mx-2 text-xs font-medium">vs</span>
                          <div className="h-6 bg-yellow-100 border border-yellow-200 rounded" style={{ width: `${issue.actual * 2}px` }}></div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFix(id)}
                      className="ml-4"
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
      {formatting?.anomalies && formatting.anomalies.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Visual Anomalies</h3>
          <div className="space-y-4">
            {formatting.anomalies.map((anomaly, index) => {
              const id = `anomaly-${index}`
              if (fixedIssues.has(id)) return null

              return (
                <Card key={id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="w-full">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="font-medium">
                          {anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)} Detected
                        </span>
                      </div>
                      
                      {/* Location details */}
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <div className="flex items-center mr-3">
                          <FileText className="h-3 w-3 mr-1" />
                          <span>Page {anomaly.page}</span>
                        </div>
                        <div className="flex items-center">
                          <Maximize className="h-3 w-3 mr-1" />
                          <span>Position: ({anomaly.location.x}, {anomaly.location.y})</span>
                        </div>
                      </div>
                      
                      {/* Issue details */}
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100">
                        <div className="font-medium mb-1">Description:</div>
                        <div className="mb-2">{anomaly.description}</div>
                        
                        {anomaly.affectedArea && (
                          <div className="flex items-center mt-2">
                            <span className="font-medium">Affected Area: </span>
                            <span className="ml-1 font-mono text-xs">
                              {anomaly.affectedArea.width}px × {anomaly.affectedArea.height}px
                            </span>
                          </div>
                        )}
                        
                        {/* Visual indicator for anomaly type */}
                        <div 
                          className={`
                            mt-3 p-2 rounded border
                            ${anomaly.type === 'corruption' ? 'bg-red-50 border-red-200' : ''}
                            ${anomaly.type === 'repetition' ? 'bg-orange-50 border-orange-200' : ''}
                            ${anomaly.type === 'unknown' ? 'bg-gray-50 border-gray-200' : ''}
                          `}
                        >
                          <div className="text-xs font-medium mb-1">
                            {anomaly.type === 'corruption' && 'Possible data corruption detected'}
                            {anomaly.type === 'repetition' && 'Repeated elements detected'}
                            {anomaly.type === 'unknown' && 'Unknown anomaly detected'}
                          </div>
                          <div className="text-xs">
                            {anomaly.type === 'corruption' && 'This may indicate damaged PDF data or rendering issues.'}
                            {anomaly.type === 'repetition' && 'Content appears to be duplicated unintentionally.'}
                            {anomaly.type === 'unknown' && 'The system detected an unusual pattern that requires attention.'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFix(id)}
                      className="ml-4"
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