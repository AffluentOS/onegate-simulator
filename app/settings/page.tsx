import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PW_MSG: Record<string, string> = {
  ok: 'Password updated.',
  bad: 'Current password is incorrect.',
  short: 'New password must be at least 8 characters.',
};

export default async function Settings({ searchParams }: { searchParams: Promise<{ pw?: string }> }) {
  const s = await getSession();
  if (!s) redirect('/login');
  const sp = await searchParams;
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const proto = h.get('x-forwarded-proto') || 'https';
  const base = `${proto}://${host}`;
  const isAdmin = s.role === 'admin';

  const users = isAdmin ? await prisma.user.findMany({ orderBy: { createdAt: 'asc' } }) : [];
  const invites = isAdmin ? await prisma.invite.findMany({ where: { usedById: null }, orderBy: { createdAt: 'desc' } }) : [];

  return (
    <div className="wrap">
      <div className="settings-head">
        <div>
          <div className="eyebrow">OneGate · Settings</div>
          <h1 className="settings-title">Settings</h1>
        </div>
        <a className="btn" href="/">← Back to simulator</a>
      </div>

      {/* Account */}
      <div className="panel" id="account" style={{ marginBottom: 24 }}>
        <h2>Account</h2>
        <div className="panel-sub">Signed in as <b>{s.username}</b> · {s.role}</div>
        <div style={{ padding: '18px 24px 24px' }}>
          <form action="/api/account/password" method="post" className="formgrid">
            <div className="afield"><label>Current password</label><input className="input" name="current" type="password" autoComplete="current-password" required /></div>
            <div className="afield"><label>New password</label><input className="input" name="next" type="password" autoComplete="new-password" minLength={8} required /></div>
            <div className="afield" style={{ justifyContent: 'flex-end' }}><button className="btn btn-primary" type="submit">Update password</button></div>
          </form>
          {sp?.pw ? <div className={`msg ${sp.pw === 'ok' ? 'msg-ok' : 'msg-err'}`}>{PW_MSG[sp.pw]}</div> : null}
          <div style={{ marginTop: 18 }}><a className="btn" href="/api/auth/logout">Sign out</a></div>
        </div>
      </div>

      {/* Users (admin) */}
      {isAdmin ? (
        <div className="panel" id="users">
          <h2>Users</h2>
          <div className="panel-sub">Manage who can access the simulator.</div>
          <div style={{ padding: '14px 24px 8px' }}>
            <table className="bd">
              <thead><tr><th>Username</th><th>Role</th><th>Joined</th><th></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}{u.id === s.id ? ' (you)' : ''}</td>
                    <td>{u.role}</td>
                    <td className="n">{u.createdAt.toISOString().slice(0, 10)}</td>
                    <td>
                      {u.id === s.id ? null : (
                        <form action="/api/users/delete" method="post" style={{ display: 'inline' }}>
                          <input type="hidden" name="id" value={u.id} />
                          <button className="btn btn-danger" type="submit">Remove</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '8px 24px 8px', borderTop: '1px solid var(--border-light)' }}>
            <h3 className="subhead">Invite a user</h3>
            <form action="/api/users/invite" method="post" className="inviteform">
              <select className="input" name="role" defaultValue="member">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button className="btn btn-primary" type="submit">Generate invite link</button>
            </form>
          </div>

          <div style={{ padding: '8px 24px 24px' }}>
            <h3 className="subhead">Pending invites</h3>
            {invites.length === 0 ? <div className="panel-sub" style={{ padding: 0 }}>No pending invites.</div> : (
              <div className="invlist">
                {invites.map((inv) => (
                  <div className="invrow" key={inv.id}>
                    <input className="linkfield" readOnly value={`${base}/signup?token=${inv.token}`} />
                    <span className="pill">{inv.role}</span>
                    <form action="/api/users/revoke" method="post" style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={inv.id} />
                      <button className="btn btn-danger" type="submit">Revoke</button>
                    </form>
                  </div>
                ))}
              </div>
            )}
            <p className="panel-sub" style={{ padding: '10px 0 0' }}>Copy a link and share it. Each link works once.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
