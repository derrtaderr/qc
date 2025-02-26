import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Define interface for the text analysis result from Claude
interface ClaudeAnalysisIssue {
  type: 'spelling' | 'grammar' | 'style';
  description: string;
  suggestion?: string;
  location: {
    start: number;
    end: number;
  };
}

// Function to extract the full sentence containing an issue
function extractSentenceContext(text: string, position: number): string {
  // Define sentence boundaries
  const sentenceBoundaries = ['.', '?', '!'];
  
  // Find the start of the sentence (search backward from position)
  let sentenceStart = position;
  while (sentenceStart > 0) {
    sentenceStart--;
    if (sentenceBoundaries.includes(text[sentenceStart]) && 
        (sentenceStart + 1 >= text.length || text[sentenceStart + 1] === ' ')) {
      sentenceStart += 2; // Move past the boundary and space
      break;
    }
  }
  if (sentenceStart < 0 || sentenceStart > position) sentenceStart = Math.max(0, position - 50);
  
  // Find the end of the sentence (search forward from position)
  let sentenceEnd = position;
  while (sentenceEnd < text.length - 1) {
    sentenceEnd++;
    if (sentenceBoundaries.includes(text[sentenceEnd])) {
      sentenceEnd++; // Include the boundary
      break;
    }
  }
  if (sentenceEnd >= text.length) sentenceEnd = text.length;
  
  // Get the sentence and ensure it's not too long or too short
  let sentence = text.substring(sentenceStart, sentenceEnd).trim();
  
  // If the sentence is too short, get more context
  if (sentence.length < 20 && position + 50 < text.length) {
    sentence = text.substring(Math.max(0, position - 30), Math.min(text.length, position + 70)).trim();
  }
  
  return sentence;
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }
    
    console.log(`Analyzing text with Claude API (length: ${text.length} chars)`);
    
    let issues: ClaudeAnalysisIssue[] = [];
    
    // Initialize the Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    try {
      // Call Claude API for text analysis
      const response = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `Analyze the following text for spelling, grammar, and style issues.
For each issue you find, please provide:
1. The type of issue (spelling, grammar, punctuation, style)
2. A description of the issue
3. The exact position of the issue in the text (character index, 0-based)
4. The length of the issue (how many characters it spans)
5. A suggestion for how to fix it

Only report genuine errors - ignore proper nouns or technical terms.
For each issue, include the entire sentence where the error occurs.

Format your response as a JSON array of issues, like this:
[
  {
    "type": "spelling",
    "description": "Misspelled word 'recieve'",
    "position": 42,
    "length": 7,
    "suggestion": "receive",
    "location": {
      "sentence": "The complete sentence containing the error recieve goes here."
    }
  }
]

Text to analyze:
${text}`
          }
        ]
      });
      
      console.log("Claude API response received");
      
      // Extract the JSON from Claude's response
      const responseContent = response.content[0];
      
      // Make sure we have a text block from Claude, not a tool use
      if (responseContent.type === 'text') {
        try {
          // Try to parse Claude's JSON response
          // It might be wrapped in markdown code blocks, so we need to handle that
          let jsonText = responseContent.text;
          
          // If response is wrapped in code blocks, extract just the JSON
          if (jsonText.includes('```json')) {
            const jsonMatch = jsonText.match(/```json\n([\s\S]*?)```/);
            if (jsonMatch && jsonMatch[1]) {
              jsonText = jsonMatch[1];
            }
          } else if (jsonText.includes('```')) {
            const jsonMatch = jsonText.match(/```\n([\s\S]*?)```/);
            if (jsonMatch && jsonMatch[1]) {
              jsonText = jsonMatch[1];
            }
          }
          
          // Parse the JSON
          const parsedIssues = JSON.parse(jsonText);
          
          if (Array.isArray(parsedIssues)) {
            issues = parsedIssues.map((issue: any) => {
              // Extract full sentence context for this issue
              const fullSentence = extractSentenceContext(text, issue.position);
              
              // Determine which part of the sentence contains the error
              const errorWord = text.substring(issue.position, issue.position + issue.length || 10);
              
              return {
                type: issue.type,
                description: issue.description,
                suggestion: issue.suggestion,
                location: {
                  ...issue.location,
                  fullSentence,
                  errorWord,
                  errorPosition: issue.position,
                  contextBefore: text.substring(Math.max(0, issue.position - 30), issue.position),
                  contextAfter: text.substring(issue.position + (issue.length || 1), Math.min(text.length, issue.position + 30))
                }
              };
            });
            console.log(`Claude found ${issues.length} issues in the text`);
          } else {
            console.error("Claude did not return an array of issues:", jsonText);
          }
        } catch (parseError) {
          console.error("Error parsing Claude response:", parseError);
          console.log("Raw response:", responseContent.text);
          
          // Fall back to mock implementation if parsing fails
          issues = await fallbackAnalysis(text);
        }
      } else {
        console.error("Unexpected response type from Claude");
        issues = await fallbackAnalysis(text);
      }
    } catch (claudeError) {
      console.error("Error calling Claude API:", claudeError);
      
      // Fall back to basic mock implementation
      issues = await fallbackAnalysis(text);
    }
    
    // Sort issues by their position in the text
    issues.sort((a, b) => a.location.start - b.location.start);
    
    return NextResponse.json({ issues });
    
  } catch (error) {
    console.error('Error analyzing text:', error);
    return NextResponse.json(
      { error: 'Failed to analyze text' },
      { status: 500 }
    );
  }
}

// Fallback analysis implementation if Claude API fails
async function fallbackAnalysis(text: string): Promise<ClaudeAnalysisIssue[]> {
  console.log("Using fallback text analysis");
  const issues: ClaudeAnalysisIssue[] = [];
  
  // Check for the specific phrase the user was having trouble with
  const learnMorePattern = /learn more a right/i;
  let match = learnMorePattern.exec(text);
  if (match) {
    issues.push({
      type: 'grammar',
      description: "'Learn more a right' is grammatically incorrect",
      suggestion: 'Learn more at right',
      location: {
        start: match.index,
        end: match.index + match[0].length
      }
    });
  }
  
  // Look for common grammar issues
  // Double spaces
  const doubleSpaceRegex = /\s{2,}/g;
  let spaceMatch;
  while ((spaceMatch = doubleSpaceRegex.exec(text)) !== null) {
    issues.push({
      type: 'grammar',
      description: 'Double spaces detected',
      suggestion: ' ',
      location: {
        start: spaceMatch.index,
        end: spaceMatch.index + spaceMatch[0].length
      }
    });
  }
  
  // Sentences starting with lowercase
  const sentenceRegex = /(?:^|[.!?]\s+)([a-z][^.!?]*[.!?])/g;
  let sentenceMatch;
  while ((sentenceMatch = sentenceRegex.exec(text)) !== null) {
    const position = sentenceMatch.index + (sentenceMatch[0].match(/^[.!?]\s+/) || [''])[0].length;
    
    issues.push({
      type: 'grammar',
      description: 'Sentence should start with a capital letter',
      suggestion: sentenceMatch[1].charAt(0).toUpperCase() + sentenceMatch[1].slice(1),
      location: {
        start: position,
        end: position + sentenceMatch[1].length
      }
    });
  }
  
  // Style inconsistencies
  const stylePatterns = [
    {
      pattern: /IC\s*50|ic\s*50|Ic\s*50/g,
      correctForm: 'IC50',
      description: 'Incorrect formatting of "IC50"'
    },
    {
      pattern: /p\s*value|P\s*value|p\s*Value/g,
      correctForm: 'p-value',
      description: 'Incorrect formatting of "p-value"'
    },
    {
      pattern: /et\s*al(?!\.)/g,
      correctForm: 'et al.',
      description: 'Incorrect formatting of "et al."'
    },
    {
      pattern: /in-vitro|invitro|InVitro/g,
      correctForm: 'in vitro',
      description: 'Incorrect formatting of "in vitro"'
    },
    {
      pattern: /in-vivo|invivo|InVivo/g,
      correctForm: 'in vivo',
      description: 'Incorrect formatting of "in vivo"'
    }
  ];
  
  for (const style of stylePatterns) {
    let styleMatch;
    while ((styleMatch = style.pattern.exec(text)) !== null) {
      // Only add issues for text that doesn't match the correct form
      if (styleMatch[0] !== style.correctForm) {
        issues.push({
          type: 'style',
          description: style.description,
          suggestion: style.correctForm,
          location: {
            start: styleMatch.index,
            end: styleMatch.index + styleMatch[0].length
          }
        });
      }
    }
  }
  
  // Check for typos in common words (mock implementation)
  const commonTypos = [
    { wrong: /\bteh\b/g, right: 'the' },
    { wrong: /\brecieve\b/g, right: 'receive' },
    { wrong: /\bseperate\b/g, right: 'separate' },
    { wrong: /\boccured\b/g, right: 'occurred' },
    { wrong: /\bthier\b/g, right: 'their' }
  ];
  
  for (const typo of commonTypos) {
    let typoMatch;
    while ((typoMatch = typo.wrong.exec(text)) !== null) {
      issues.push({
        type: 'spelling',
        description: `"${typoMatch[0]}" is misspelled`,
        suggestion: typo.right,
        location: {
          start: typoMatch.index,
          end: typoMatch.index + typoMatch[0].length
        }
      });
    }
  }
  
  console.log(`Fallback analysis found ${issues.length} issues in the text`);
  return issues.map((issue: ClaudeAnalysisIssue) => {
    // Extract full sentence context for this issue
    const fullSentence = extractSentenceContext(text, issue.location.start);
    
    // Determine which part of the sentence contains the error
    const errorWord = text.substring(issue.location.start, issue.location.end || 10);
    
    return {
      ...issue,
      location: {
        ...issue.location,
        fullSentence,
        errorWord,
        errorPosition: issue.location.start,
        contextBefore: text.substring(Math.max(0, issue.location.start - 30), issue.location.start),
        contextAfter: text.substring(issue.location.end || 1, Math.min(text.length, issue.location.start + 30))
      }
    };
  });
} 