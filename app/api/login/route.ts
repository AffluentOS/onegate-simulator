import { NextRequest, NextResponse } from 'next/server';

function baseUrl(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '') || 'https';
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const pw = String(form.get('password') || '');
  const base = baseUrl(req);
  const expected = process.env.APP_PASSWORD;
  if (expected && pw === expected) {
    const res = NextResponse.redirect(`${base}/`, 303);
    res.cookies.set('og_auth', process.env.SESSION_TOKEN || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }
  return NextResponse.redirect(`${base}/login?error=1`, 303);
}
