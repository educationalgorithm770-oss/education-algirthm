import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

// Routes that require authentication — any path starting with these prefixes
const PROTECTED_STUDENT    = ['/dashboard', '/ai-tutor', '/internships'];
const PROTECTED_ADMIN      = ['/admin', '/security-audit'];
const PROTECTED_INSTRUCTOR = ['/instructor'];

// Auth pages — redirect away if already logged in
const AUTH_PAGES = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Skip Next.js internal paths and recognized static assets ─────────────
  const isStaticAsset = /\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|map|woff2?|ttf|eot)$/i.test(pathname);
  if (pathname.startsWith('/_next') || (isStaticAsset && !pathname.startsWith('/api'))) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);

  // ── Protect API routes ──────────────────────────────────────────────────────
  if (pathname.startsWith('/api/admin')) {
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Admin authorization required.' },
        { status: 403 }
      );
    }
  }

  if (pathname.startsWith('/api/instructor')) {
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Instructor authorization required.' },
        { status: 403 }
      );
    }
  }

  if (pathname.startsWith('/api/student')) {
    if (!session || session.role !== 'student') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Student authentication required.' },
        { status: 401 }
      );
    }
  }

  // ── Protect student dashboard pages ─────────────────────────────────────────
  if (PROTECTED_STUDENT.some(p => pathname.startsWith(p))) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== 'student') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // ── Protect admin panel ────────────────────────────────────────────────────────
  if (PROTECTED_ADMIN.some(p => pathname.startsWith(p))) {
    // /admin/login is always public
    if (pathname === '/admin/login') return NextResponse.next();

    if (!session || session.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // ── Protect instructor panel ───────────────────────────────────────────────────
  if (PROTECTED_INSTRUCTOR.some(p => pathname.startsWith(p))) {
    // /instructor/login is always public
    if (pathname === '/instructor/login') return NextResponse.next();

    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.redirect(new URL('/instructor/login', request.url));
    }
  }

  // ── Redirect authenticated users away from auth pages ─────────────────────────
  if (pathname === '/login' && session?.role === 'student') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname === '/admin/login' && session?.role === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (pathname === '/instructor/login' && (session?.role === 'instructor' || session?.role === 'admin')) {
    return NextResponse.redirect(new URL('/instructor', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static (static files)
     *  - _next/image  (image optimization)
     *  - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
