import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '') || 'https';
  const res = NextResponse.redirect(`${proto}://${host}/login`, 303);
  res.cookies.set('og_auth', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
