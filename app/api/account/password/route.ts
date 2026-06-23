import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, verifyPassword, hashPassword } from '@/lib/auth';

function base(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '') || 'https';
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  const b = base(req);
  if (!s) return NextResponse.redirect(`${b}/login`, 303);
  const form = await req.formData();
  const current = String(form.get('current') || '');
  const next = String(form.get('next') || '');
  const user = await prisma.user.findUnique({ where: { id: s.id } });
  if (!user || !verifyPassword(current, user.passwordHash)) {
    return NextResponse.redirect(`${b}/settings?pw=bad#account`, 303);
  }
  if (next.length < 8) return NextResponse.redirect(`${b}/settings?pw=short#account`, 303);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(next) } });
  return NextResponse.redirect(`${b}/settings?pw=ok#account`, 303);
}
