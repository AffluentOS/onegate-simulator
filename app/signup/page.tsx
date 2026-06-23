export default async function Signup({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const sp = await searchParams;
  const token = sp?.token || '';
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="eyebrow">OneGate</div>
        <h1>Create your account</h1>
        <p>{token ? 'You were invited. Choose a username and password.' : 'Set up your account to continue.'}</p>
        <form action="/api/auth/signup" method="post">
          <input type="hidden" name="token" value={token} />
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" autoComplete="username" required autoFocus />
          <label htmlFor="password" style={{ marginTop: 14, display: 'block' }}>Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          <button type="submit">Create account</button>
          {sp?.error ? <div className="err">{sp.error}</div> : null}
        </form>
        <p className="login-foot">Already have an account? <a href="/login">Sign in</a>.</p>
      </div>
    </div>
  );
}
