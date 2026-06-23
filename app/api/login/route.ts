import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const pw = String(form.get('password') || '');
  const expected = process.env.APP_PASSWORD;
  if (expected && pw === expected) {
    const res = NextResponse.redirect(new URL('/', req.url), 303);
    res.cookies.set('og_auth', process.env.SESSION_TOKEN || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }
  return NextResponse.redirect(new URL('/login?error=1', req.url), 303);
}
