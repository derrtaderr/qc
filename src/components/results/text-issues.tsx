"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, MapPin, FileText } from "lucide-react"

interface TextIssue {
  type: 'spelling' | 'grammar' | 'style';
  description: string;
  suggestion?: string;
  location: { 
    start: number; 
    end: number;
    page?: number;
    paragraph?: number;
    section?: string;
    contextBefore?: string;
    contextAfter?: string;
    errorWord?: string;
    fullSentence?: string;
  };
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

  const renderIssueContext = (issue: TextIssue, content: string) => {
    if (issue.location?.fullSentence) {
      return (
        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
          <div className="font-mono whitespace-pre-wrap break-words">
            {issue.location.contextBefore && <span className="text-gray-500">{issue.location.contextBefore}</span>}
            <span className="bg-red-100 text-red-700 font-bold px-0.5 rounded">{issue.location.errorWord}</span>
            {issue.location.contextAfter && <span className="text-gray-500">{issue.location.contextAfter}</span>}
          </div>
          <div className="mt-2 italic text-gray-700">
            <strong>Full sentence:</strong> {issue.location.fullSentence}
          </div>
        </div>
      );
    }
    
    const contextStart = Math.max(0, issue.location.start - 20);
    const contextEnd = Math.min(content.length, issue.location.end + 20);
    
    const beforeError = content.substring(
      contextStart,
      issue.location.start
    );
    
    const errorText = content.substring(
      issue.location.start,
      issue.location.end
    );
    
    const afterError = content.substring(
      issue.location.end,
      contextEnd
    );
    
    return (
      <div className="issue-context">
        <span className="context-before">{beforeError}</span>
        <span className="error-word">{errorText}</span>
        <span className="context-after">{afterError}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {issues.map((issue, index) => {
        if (fixedIssues.has(index)) return null

        return (
          <Card key={index} className="p-4">
            <div className="flex items-start justify-between">
              <div className="w-full">
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
                
                {/* Location information */}
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  {issue.location.page && (
                    <div className="flex items-center mr-3">
                      <FileText className="h-3 w-3 mr-1" />
                      <span>Page {issue.location.page}</span>
                    </div>
                  )}
                  {issue.location.paragraph && (
                    <div className="flex items-center mr-3">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>Paragraph {issue.location.paragraph}</span>
                    </div>
                  )}
                  {issue.location.section && (
                    <div className="flex items-center">
                      <span>Section: {issue.location.section}</span>
                    </div>
                  )}
                </div>
                
                {/* Context with highlighted issue */}
                {renderIssueContext(issue, content)}
                
                {issue.suggestion && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">Suggestion: </span>
                    <span className="text-sm font-medium">{issue.suggestion}</span>
                  </div>
                )}
              </div>
              <div className="flex space-x-2 ml-4">
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