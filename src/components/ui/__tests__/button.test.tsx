import { render, screen } from '@testing-library/react'
import { Button } from '../button'

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByText('Click me')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary')
  })

  it('renders with outline variant', () => {
    render(<Button variant="outline">Click me</Button>)
    const button = screen.getByText('Click me')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('border-input')
  })

  it('renders with custom className', () => {
    render(<Button className="custom-class">Click me</Button>)
    const button = screen.getByText('Click me')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('custom-class')
  })
}) 