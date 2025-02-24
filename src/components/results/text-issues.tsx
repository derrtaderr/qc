import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

interface TextIssue {
  type: 'spelling' | 'grammar' | 'style';
  description: string;
  suggestion?: string;
  location: { start: number; end: number };
}

interface TextIssuesProps {
  issues: TextIssue[];
  content: string;
}

export function TextIssues({ issues, content }: TextIssuesProps) {
  const [fixedIssues, setFixedIssues] = React.useState<Set<number>>(new Set())

  const handleFix = (index: number) => {
    setFixedIssues(prev => {
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }

  const handleIgnore = (index: number) => {
    setFixedIssues(prev => {
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }

  if (issues.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No text issues found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {issues.map((issue, index) => {
        if (fixedIssues.has(index)) return null

        const context = content.slice(
          Math.max(0, issue.location.start - 20),
          Math.min(content.length, issue.location.end + 20)
        )

        return (
          <Card key={index} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`
                    px-2 py-1 rounded-full text-xs
                    ${issue.type === 'spelling' ? 'bg-red-100 text-red-600' : ''}
                    ${issue.type === 'grammar' ? 'bg-yellow-100 text-yellow-600' : ''}
                    ${issue.type === 'style' ? 'bg-blue-100 text-blue-600' : ''}
                  `}>
                    {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}
                  </span>
                  <span className="font-medium">{issue.description}</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-mono bg-gray-100 px-1 rounded">
                    ...{context}...
                  </span>
                </div>
                {issue.suggestion && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">Suggestion: </span>
                    <span className="text-sm font-medium">{issue.suggestion}</span>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                {issue.suggestion && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => handleFix(index)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Fix
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-500 hover:text-gray-600"
                  onClick={() => handleIgnore(index)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Ignore
                </Button>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
} 