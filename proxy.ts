import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('session');
    const { pathname } = request.nextUrl;

    // Update session expiry if it exists
    if (session) {
        await updateSession(request);
    }

    // Auth routes (login, register) - redirect to dashboard if logged in
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
        if (session) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }

    // Protected routes - redirect to login if not logged in
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/upload')) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (except api/upload which we want to protect)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ],
};
