import '@testing-library/jest-dom'

// Mock window.URL.createObjectURL
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = jest.fn()
  window.URL.revokeObjectURL = jest.fn()
}

// Mock console.error to fail tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    originalError(...args)
    throw new Error('Console error was called')
  }
})

afterAll(() => {
  console.error = originalError
})

// Clean up any global mocks after each test
afterEach(() => {
  jest.clearAllMocks()
}) 