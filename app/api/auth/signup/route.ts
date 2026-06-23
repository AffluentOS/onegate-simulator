import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createToken, cookieOptions, COOKIE } from '@/lib/auth';

function base(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '') || 'https';
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const username = String(form.get('username') || '').trim();
  const password = String(form.get('password') || '');
  const token = String(form.get('token') || '');
  const b = base(req);
  const back = (msg: string) =>
    NextResponse.redirect(`${b}/signup?error=${encodeURIComponent(msg)}${token ? `&token=${encodeURIComponent(token)}` : ''}`, 303);

  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) return back('Username must be 3-32 characters (letters, numbers, . _ -)');
  if (password.length < 8) return back('Password must be at least 8 characters');

  const userCount = await prisma.user.count();
  let role: 'admin' | 'member' = 'member';
  let inviteId: string | null = null;

  if (userCount === 0) {
    role = 'admin';
  } else {
    if (!token) return back('An invite is required to sign up');
    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite || invite.usedById) return back('Invite link is invalid or already used');
    if (invite.expiresAt && invite.expiresAt < new Date()) return back('Invite link has expired');
    role = invite.role === 'admin' ? 'admin' : 'member';
    inviteId = invite.id;
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return back('That username is taken');

  const user = await prisma.user.create({ data: { username, passwordHash: hashPassword(password), role } });
  if (inviteId) await prisma.invite.update({ where: { id: inviteId }, data: { usedById: user.id } });

  const jwt = await createToken({ id: user.id, username: user.username, role: user.role as 'admin' | 'member' });
  const res = NextResponse.redirect(`${b}/`, 303);
  res.cookies.set(COOKIE, jwt, cookieOptions());
  return res;
}
