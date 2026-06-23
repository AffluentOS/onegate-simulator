import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/login', req.url), 303);
  res.cookies.set('og_auth', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
