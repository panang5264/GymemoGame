import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Redirect any `/minigame/...` path that contains uppercase characters to its
 * fully-lowercase equivalent.  This prevents 404s and the Next.js type-generation
 * file-collision error on Windows (case-insensitive filesystems) that occurs when
 * both `/minigame/management` and `/minigame/Management` end up in `.next/types`.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const lower = pathname.toLowerCase()
  if (pathname !== lower) {
    const url = request.nextUrl.clone()
    url.pathname = lower
    return NextResponse.redirect(url, { status: 308 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/minigame/:path*',
}
