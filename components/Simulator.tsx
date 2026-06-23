'use client';

import { useMemo, useState } from 'react';
import {
  DEFAULT_VERTICALS, DEFAULT_ENGINE, simulate, fmtR, perClientGP,
  type Vertical, type EngineSettings, type SimResult, type Cadence,
} from '@/lib/engine';

type Metric = 'gp' | 'rev' | 'vol';

function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

export default function Simulator() {
  const [verticals, setVerticals] = useState<Vertical[]>(() => clone(DEFAULT_VERTICALS));
  const [engine, setEngine] = useState<EngineSettings>(() => clone(DEFAULT_ENGINE));
  const [mult, setMult] = useState(1);
  const [horizon, setHorizon] = useState(36);
  const [metric, setMetric] = useState<Metric>('gp');

  const sim = useMemo(() => simulate(verticals, engine, mult, horizon), [verticals, engine, mult, horizon]);

  function setTier(vi: number, ti: number, field: 'volume' | 'take' | 'margin' | 'rate', value: number) {
    setVerticals((prev) => {
      const next = clone(prev);
      next[vi].tiers[ti][field] = Math.max(0, value || 0);
      return next;
    });
  }
  function setCad(vi: number, ti: number, cad: Cadence) {
    setVerticals((prev) => { const next = clone(prev); next[vi].tiers[ti].cad = cad; return next; });
  }
  function setEng(key: keyof EngineSettings | 'cycle0' | 'cycle1' | 'cycle2', value: number) {
    setEngine((prev) => {
      const next = clone(prev);
      const v = Math.max(0, value || 0);
      if (key === 'cycle0') next.cycle[0] = v;
      else if (key === 'cycle1') next.cycle[1] = v;
      else if (key === 'cycle2') next.cycle[2] = v;
      else (next as any)[key] = v;
      return next;
    });
  }

  return (
    <div className="wrap">
      <header className="hero">
        <div className="topbar">
          <div className="eyebrow">OneGate · Financial Scenario Model</div>
          <a className="logout" href="/api/logout">Sign out</a>
        </div>
        <h1>Payment Growth &amp; Gross Profit Simulator</h1>
        <p>Model new-client acquisition across verticals and tiers, apply realistic sales cycles and ramp, and see the processing volume, net revenue and gross profit it produces. Every assumption is a dial. Adjust live.</p>
        <div className="scenariobar">
          <div className="seg">
            {[['Conservative', 0.5], ['Base', 1], ['Aggressive', 1.75]].map(([label, m]) => (
              <button key={label as string} className={mult === m ? 'active' : ''} onClick={() => setMult(m as number)}>{label}</button>
            ))}
          </div>
          <div className="hz">Horizon
            <select value={horizon} onChange={(e) => setHorizon(+e.target.value)}>
              <option value={24}>24 months</option>
              <option value={36}>36 months</option>
              <option value={48}>48 months</option>
            </select>
          </div>
        </div>
      </header>

      <Kpis sim={sim} />

      <div className="grid">
        <div className="verticals">
          {verticals.map((v, vi) => (
            <div className="vcard" key={v.key}>
              <div className="vhead">
                <div>
                  <div className="vname">{v.name}</div>
                  <div className="vmeta">{v.meta}</div>
                </div>
                <div className="vgp">{fmtR(sim.per[v.key].gp)}<small>exit run-rate GP</small></div>
              </div>
              <table className="tiers">
                <thead>
                  <tr><th>Tier</th><th>Volume / mo</th><th>Take %</th><th>GP %</th><th>Per client</th><th>New</th><th>Cadence</th></tr>
                </thead>
                <tbody>
                  {v.tiers.map((t, ti) => (
                    <tr key={t.label}>
                      <td className="tname">{t.label}<small>{t.hint}</small></td>
                      <td><input className="num" type="number" min={0} step={1000000} value={t.volume} onChange={(e) => setTier(vi, ti, 'volume', +e.target.value)} /></td>
                      <td><input className="num" type="number" min={0} step={0.05} value={t.take} onChange={(e) => setTier(vi, ti, 'take', +e.target.value)} /></td>
                      <td><input className="num" type="number" min={0} max={100} step={1} value={t.margin} onChange={(e) => setTier(vi, ti, 'margin', +e.target.value)} /></td>
                      <td className="percluster">{fmtR(perClientGP(t))}<br /><span>GP / client / yr</span></td>
                      <td><input className="num rate" type="number" min={0} step={1} value={t.rate} onChange={(e) => setTier(vi, ti, 'rate', +e.target.value)} /></td>
                      <td>
                        <div className="cad">
                          <button className={t.cad === 'm' ? 'active' : ''} onClick={() => setCad(vi, ti, 'm')}>/mo</button>
                          <button className={t.cad === 'q' ? 'active' : ''} onClick={() => setCad(vi, ti, 'q')}>/qtr</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div>
          <div className="panel" style={{ marginBottom: 24 }}>
            <h2>{metric === 'gp' ? 'Gross Profit' : metric === 'rev' ? 'Net Revenue' : 'Processing Volume'} Build</h2>
            <div className="panel-sub">Monthly across the full horizon · exit run-rate {fmtR(metric === 'gp' ? sim.exitGP : metric === 'rev' ? sim.exitRev : sim.exitVol)}</div>
            <div className="chart-tabs">
              {([['gp', 'Gross Profit'], ['rev', 'Net Revenue'], ['vol', 'Volume']] as [Metric, string][]).map(([m, label]) => (
                <button key={m} className={metric === m ? 'active' : ''} onClick={() => setMetric(m)}>{label}</button>
              ))}
            </div>
            <div className="chartbox">
              <div className="legend"><span><span className="dot" style={{ background: 'var(--gold)' }} />Monthly value</span><span><span className="dot" style={{ background: 'var(--royal)' }} />Year boundaries</span></div>
              <Chart data={sim[metric]} />
            </div>
          </div>

          <div className="panel">
            <h2>Per-Vertical Breakdown</h2>
            <div className="panel-sub">At exit run-rate (final month, annualised)</div>
            <div style={{ padding: '14px 18px 20px' }}>
              <Breakdown verticals={verticals} sim={sim} />
            </div>
          </div>
        </div>
      </div>

      <details className="assume">
        <summary>Assumptions &amp; engine settings (sales cycle, ramp) — auditable</summary>
        <div className="assume-body">
          <AField label="T1 sales cycle (mo)" value={engine.cycle[0]} onChange={(v) => setEng('cycle0', v)} />
          <AField label="T2 sales cycle (mo)" value={engine.cycle[1]} onChange={(v) => setEng('cycle1', v)} />
          <AField label="T3 sales cycle (mo)" value={engine.cycle[2]} onChange={(v) => setEng('cycle2', v)} />
          <AField label="Ramp to full (mo)" value={engine.ramp} onChange={(v) => setEng('ramp', v)} />
          <AField label="Platform cycle (mo)" value={engine.platCycle} onChange={(v) => setEng('platCycle', v)} />
          <AField label="Platform ramp (mo)" value={engine.platRamp} onChange={(v) => setEng('platRamp', v)} />
        </div>
        <p className="note">
          <b>Known</b> (CallPay published): R526 ticket · R849m/mo · 11,298 merchants · PCI-DSS Level 1.{' '}
          <b>Assumed</b> (calibrate together): tier volumes, take rates, GP margins, cycles and ramp. Platforms use an aggregate downstream book volume and a lower wholesale take.
        </p>
      </details>

      <footer>
        <b>OneGate financial simulator — illustrative.</b> Net revenue = processing volume × net take rate (what OneGate keeps after interchange / scheme / sponsor-bank pass-through). Gross profit = net revenue × GP margin. New clients are added on the chosen monthly or quarterly cadence, go live after the sales cycle, then ramp to full volume. Figures are scenario estimates for planning, not a forecast or guarantee.<br />
        Affluent Consultant · prepared for scenario planning with OneGate.
      </footer>
    </div>
  );
}

function Kpis({ sim }: { sim: SimResult }) {
  const cards: { label: string; val: string; sub: string; hero?: boolean }[] = [
    { label: 'Exit Run-Rate GP', val: fmtR(sim.exitGP), sub: 'annualised, final month', hero: true },
    { label: 'Year 1 GP', val: fmtR(sim.y1), sub: 'realised (incl. ramp)' },
    { label: 'Year 2 GP', val: fmtR(sim.y2), sub: 'realised' },
    { label: 'Year 3 GP', val: fmtR(sim.y3), sub: 'realised' },
    { label: 'Exit Run-Rate Volume', val: fmtR(sim.exitVol), sub: 'processing p.a.' },
    { label: 'Active Clients', val: String(Math.round(sim.exitClients)), sub: 'live at horizon' },
  ];
  return (
    <div className="kpis">
      {cards.map((c) => (
        <div className={`kpi${c.hero ? ' hero-kpi' : ''}`} key={c.label}>
          <div className="label">{c.label}</div>
          <div className="val">{c.val}</div>
          <div className="sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

function Chart({ data }: { data: number[] }) {
  const W = 720, H = 280, padL = 8, padR = 8, padT = 16, padB = 24;
  const max = Math.max(...data, 1);
  const n = data.length;
  const x = (i: number) => padL + (i / (n - 1)) * (W - padL - padR);
  const yv = (v: number) => padT + (1 - v / max) * (H - padT - padB);
  let area = `M ${x(0)} ${H - padB}`;
  data.forEach((v, i) => { area += ` L ${x(i).toFixed(1)} ${yv(v).toFixed(1)}`; });
  area += ` L ${x(n - 1)} ${H - padB} Z`;
  let line = 'M';
  data.forEach((v, i) => { line += ` ${x(i).toFixed(1)} ${yv(v).toFixed(1)}`; });
  const grids = [];
  for (let yr = 12; yr < n; yr += 12) {
    grids.push(
      <g key={yr}>
        <line x1={x(yr)} y1={padT} x2={x(yr)} y2={H - padB} stroke="#2557A7" strokeDasharray="3 4" strokeWidth={1} opacity={0.4} />
        <text x={x(yr)} y={H - 8} fontFamily="Inter" fontSize={10} fill="#6B7A94" textAnchor="middle">Yr {yr / 12 + 1}</text>
      </g>
    );
  }
  const ylabs = [0, 0.5, 1].map((f) => (
    <text key={f} x={W - 2} y={yv(max * f) - 3} fontFamily="JetBrains Mono" fontSize={10} fill="#6B7A94" textAnchor="end">{fmtR(max * f * 12)} p.a.</text>
  ));
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C9A84C" stopOpacity={0.35} /><stop offset="100%" stopColor="#C9A84C" stopOpacity={0} /></linearGradient></defs>
      {grids}
      <path d={area} fill="url(#g)" />
      <path d={line} fill="none" stroke="#C9A84C" strokeWidth={2.5} />
      {ylabs}
    </svg>
  );
}

function Breakdown({ verticals, sim }: { verticals: Vertical[]; sim: SimResult }) {
  let tv = 0, tr = 0, tg = 0, tc = 0;
  verticals.forEach((v) => { const p = sim.per[v.key]; tv += p.vol; tr += p.rev; tg += p.gp; tc += p.clients; });
  return (
    <table className="bd">
      <thead><tr><th>Vertical</th><th>Clients</th><th>Volume p.a.</th><th>Net rev p.a.</th><th>GP p.a.</th></tr></thead>
      <tbody>
        {verticals.map((v) => {
          const p = sim.per[v.key];
          return (
            <tr key={v.key}>
              <td>{v.name}</td>
              <td className="n">{Math.round(p.clients)}</td>
              <td className="n">{fmtR(p.vol)}</td>
              <td className="n">{fmtR(p.rev)}</td>
              <td className="n">{fmtR(p.gp)}</td>
            </tr>
          );
        })}
        <tr className="total">
          <td>Total (exit run-rate)</td>
          <td>{Math.round(tc)}</td>
          <td>{fmtR(tv)}</td>
          <td>{fmtR(tr)}</td>
          <td>{fmtR(tg)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function AField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="afield">
      <label>{label}</label>
      <input className="num" type="number" min={0} value={value} onChange={(e) => onChange(+e.target.value)} />
    </div>
  );
}
