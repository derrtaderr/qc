import { TextAnalysisService } from '../text-analysis'
import { PDFService } from '../pdf'
import { OCRService } from '../ocr'
import LanguageTool from 'languagetool-api'

// Mock dependencies
jest.mock('../pdf')
jest.mock('../ocr')
jest.mock('languagetool-api')

describe('TextAnalysisService', () => {
  const mockPDFText = 'This is extracted from pdf-parse.'
  const mockOCRText = 'This is extracted from OCR.'
  const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })

  beforeEach(() => {
    // Mock PDF extraction
    ;(PDFService.extractText as jest.Mock).mockResolvedValue({
      text: mockPDFText,
      numPages: 1,
      info: {},
    })

    // Mock OCR
    ;(OCRService.recognizeText as jest.Mock).mockResolvedValue({
      text: mockOCRText,
      confidence: 0.95,
    })

    // Mock LanguageTool
    ;(LanguageTool.prototype.check as jest.Mock).mockResolvedValue({
      matches: [
        {
          message: 'Possible spelling mistake',
          offset: 5,
          length: 4,
          replacements: [{ value: 'correct' }],
          rule: { category: { id: 'TYPOS' } },
        },
      ],
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('combines text from PDF and OCR', async () => {
    const result = await TextAnalysisService.analyzeText(mockFile)
    
    expect(result.content).toBe(`${mockPDFText}\n${mockOCRText}`)
    expect(PDFService.extractText).toHaveBeenCalledWith(mockFile)
    expect(OCRService.recognizeText).toHaveBeenCalled()
  })

  it('handles PDF extraction errors', async () => {
    const errorMessage = 'PDF extraction failed'
    ;(PDFService.extractText as jest.Mock).mockResolvedValue({
      text: '',
      error: errorMessage,
    })

    const result = await TextAnalysisService.analyzeText(mockFile)
    
    expect(result.error).toBe(errorMessage)
    expect(result.content).toBe('')
    expect(result.issues).toHaveLength(0)
  })

  it('detects spelling issues', async () => {
    const result = await TextAnalysisService.analyzeText(mockFile)
    
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0]).toEqual({
      type: 'spelling',
      description: 'Possible spelling mistake',
      suggestion: 'correct',
      location: { start: 5, end: 9 },
    })
  })

  it('detects IC50 style issues', async () => {
    ;(PDFService.extractText as jest.Mock).mockResolvedValue({
      text: 'The ic50 value is important.',
      numPages: 1,
      info: {},
    })

    const result = await TextAnalysisService.analyzeText(mockFile)
    
    const styleIssues = result.issues.filter(issue => issue.type === 'style')
    expect(styleIssues).toHaveLength(1)
    expect(styleIssues[0].description).toContain('IC50')
    expect(styleIssues[0].suggestion).toBe('IC50')
  })

  it('continues if OCR fails', async () => {
    ;(OCRService.recognizeText as jest.Mock).mockRejectedValue(new Error('OCR failed'))

    const result = await TextAnalysisService.analyzeText(mockFile)
    
    expect(result.content).toBe(mockPDFText)
    expect(result.error).toBeUndefined()
  })

  it('sorts issues by location', async () => {
    ;(LanguageTool.prototype.check as jest.Mock).mockResolvedValue({
      matches: [
        {
          message: 'Second issue',
          offset: 10,
          length: 5,
          replacements: [],
          rule: { category: { id: 'GRAMMAR' } },
        },
        {
          message: 'First issue',
          offset: 5,
          length: 4,
          replacements: [],
          rule: { category: { id: 'SPELLING' } },
        },
      ],
    })

    const result = await TextAnalysisService.analyzeText(mockFile)
    
    expect(result.issues).toHaveLength(2)
    expect(result.issues[0].location.start).toBe(5)
    expect(result.issues[1].location.start).toBe(10)
  })
}) 