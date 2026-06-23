export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="eyebrow">OneGate</div>
        <h1>Scenario Simulator</h1>
        <p>Sign in to continue.</p>
        <form action="/api/auth/login" method="post">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" autoComplete="username" required autoFocus />
          <label htmlFor="password" style={{ marginTop: 14, display: 'block' }}>Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
          <button type="submit">Sign in</button>
          {sp?.error ? <div className="err">Incorrect username or password.</div> : null}
        </form>
        <p className="login-foot">First time here? <a href="/signup">Create the first account</a>.</p>
      </div>
    </div>
  );
}
