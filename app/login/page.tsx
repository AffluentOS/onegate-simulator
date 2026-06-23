export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="eyebrow">OneGate</div>
        <h1>Scenario Simulator</h1>
        <p>Enter the access password to continue.</p>
        <form action="/api/login" method="post">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
          <button type="submit">Enter</button>
          {sp?.error ? <div className="err">Incorrect password. Try again.</div> : null}
        </form>
      </div>
    </div>
  );
}
