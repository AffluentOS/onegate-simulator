import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Fail-closed gate: every route except the login surfaces requires a valid
// session cookie equal to SESSION_TOKEN (set in Coolify env).
export function middleware(req: NextRequest) {
  const token = req.cookies.get('og_auth')?.value;
  const expected = process.env.SESSION_TOKEN;
  if (expected && token === expected) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!login|api/login|api/logout|_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
