import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that require authentication
const protectedPaths = [
    '/world',
    '/minigame',
    '/daily-challenge',
    '/calculation',
    '/relation',
    '/ending',
    '/bonus',
    '/run'
]

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value

    // Check if current path is a protected one
    const isProtectedPath = protectedPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
    )

    // Redirect to login if accessing a protected route without token
    if (isProtectedPath && !token) {
        const loginUrl = new URL('/', request.url)
        return NextResponse.redirect(loginUrl)
    }

    // Redirect away from login/register if already authenticated
    const isAuthPath = request.nextUrl.pathname === '/register' || request.nextUrl.pathname === '/'
    if (isAuthPath && token) {
        // Only redirect from exactly '/' if they have a token, but in our app page.tsx handles the UI.
        // Actually since page.tsx now holds both auth and profile logic, we shouldn't redirect away from '/' unconditionally. 
        if (request.nextUrl.pathname === '/register') {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        // Apply middleware to all routes except api, static files, images, favicon
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
