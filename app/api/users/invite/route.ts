import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, randomToken } from '@/lib/auth';

function base(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '') || 'https';
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  const b = base(req);
  if (!s || s.role !== 'admin') return NextResponse.redirect(`${b}/settings`, 303);
  const form = await req.formData();
  const role = String(form.get('role') || 'member') === 'admin' ? 'admin' : 'member';
  await prisma.invite.create({ data: { token: randomToken(), role, createdById: s.id } });
  return NextResponse.redirect(`${b}/settings#users`, 303);
}
