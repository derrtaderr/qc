import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware to handle API requests
export function middleware(request: NextRequest) {
  // For API routes that handle file uploads, we need to ensure the request is properly forwarded
  if (request.nextUrl.pathname.startsWith('/api/extract-text')) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

// Configure the paths that the middleware should run on
export const config = {
  matcher: [
    '/api/:path*',
  ],
} 