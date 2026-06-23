import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, createToken, cookieOptions, COOKIE } from '@/lib/auth';

function base(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '') || 'https';
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const username = String(form.get('username') || '').trim();
  const password = String(form.get('password') || '');
  const b = base(req);

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.redirect(`${b}/login?error=1`, 303);
  }

  const jwt = await createToken({ id: user.id, username: user.username, role: user.role as 'admin' | 'member' });
  const res = NextResponse.redirect(`${b}/`, 303);
  res.cookies.set(COOKIE, jwt, cookieOptions());
  return res;
}
