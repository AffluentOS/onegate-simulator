// ── OneGate financial simulation engine (pure, typed, testable) ──────
// Net revenue = volume × take rate. Gross profit = net revenue × margin.
// New clients are added on a monthly/quarterly cadence, go live after the
// sales cycle, then ramp to full volume. OneGate financials only.

export type Cadence = 'm' | 'q';

export interface Tier {
  label: string;
  hint: string;
  volume: number; // R per month per client (platforms: aggregate book R/month)
  take: number; // net take rate %
  margin: number; // GP margin %
  rate: number; // new clients per period
  cad: Cadence;
}

export interface Vertical {
  key: string;
  name: string;
  meta: string;
  isPlatform?: boolean;
  tiers: Tier[];
}

export interface EngineSettings {
  cycle: [number, number, number]; // sales-cycle months by tier index (direct)
  ramp: number; // ramp months (direct)
  platCycle: number; // platform sales cycle
  platRamp: number; // platform ramp (book fills over time)
}

export interface VerticalResult {
  name: string;
  vol: number;
  rev: number;
  gp: number;
  clients: number;
}

export interface SimResult {
  gp: number[];
  rev: number[];
  vol: number[];
  per: Record<string, VerticalResult>;
  exitGP: number;
  exitVol: number;
  exitRev: number;
  y1: number;
  y2: number;
  y3: number;
  totalVol: number;
  exitClients: number;
}

// ── Default model (every value is editable in the UI) ────────────────
export const DEFAULT_VERTICALS: Vertical[] = [
  { key: 'gaming', name: 'Gaming / Betting', meta: 'ticket ~R250 · high frequency', tiers: [
    { label: 'T1 Flagship', hint: 'Top-20 SA app, tens of thousands of depositors', volume: 100e6, take: 0.6, margin: 70, rate: 0, cad: 'q' },
    { label: 'T2 Large', hint: 'Regional brand, 5k–20k active', volume: 25e6, take: 0.6, margin: 70, rate: 0, cad: 'q' },
    { label: 'T3 Mid', hint: 'Niche / new operator, <5k active', volume: 10e6, take: 0.6, margin: 70, rate: 1, cad: 'q' },
  ]},
  { key: 'ecom', name: 'E-commerce / Retail', meta: 'ticket ~R650', tiers: [
    { label: 'T1 Flagship', hint: 'Top-50 SA online retailer, 1.5M+ visitors/mo', volume: 100e6, take: 0.55, margin: 78, rate: 0, cad: 'q' },
    { label: 'T2 Large', hint: 'Established mid-market, 300k–800k visitors', volume: 25e6, take: 0.55, margin: 78, rate: 0, cad: 'q' },
    { label: 'T3 Mid', hint: 'Growing store, 100k–300k visitors', volume: 10e6, take: 0.55, margin: 78, rate: 1, cad: 'q' },
  ]},
  { key: 'hosp', name: 'Hospitality / Travel', meta: 'ticket ~R6,000', tiers: [
    { label: 'T1 Flagship', hint: 'Large hotel group / OTA / airline', volume: 100e6, take: 0.6, margin: 78, rate: 0, cad: 'q' },
    { label: 'T2 Large', hint: 'Regional group, 10–50 properties', volume: 25e6, take: 0.6, margin: 78, rate: 0, cad: 'q' },
    { label: 'T3 Mid', hint: 'Boutique group / single large property', volume: 10e6, take: 0.6, margin: 78, rate: 1, cad: 'q' },
  ]},
  { key: 'forex', name: 'Forex / Trading', meta: 'ticket ~R10,000 · market-entry', tiers: [
    { label: 'T1 Flagship', hint: 'Intl broker entering SA, thousands funded', volume: 100e6, take: 0.4, margin: 72, rate: 0, cad: 'q' },
    { label: 'T2 Large', hint: 'Mid broker / early SA traction', volume: 25e6, take: 0.4, margin: 72, rate: 0, cad: 'q' },
    { label: 'T3 Mid', hint: 'Niche entrant testing SA', volume: 10e6, take: 0.4, margin: 72, rate: 1, cad: 'q' },
  ]},
  { key: 'platform', name: 'Platforms & Channel Partners', meta: 'aggregate book · wholesale take', isPlatform: true, tiers: [
    { label: 'T1 Platform', hint: 'Major casino/iGaming platform or PSP', volume: 500e6, take: 0.2, margin: 80, rate: 0, cad: 'q' },
    { label: 'T2 Platform', hint: 'Mid platform / niche aggregator', volume: 150e6, take: 0.2, margin: 80, rate: 0, cad: 'q' },
    { label: 'T3 Platform', hint: 'Small platform / channel partner', volume: 50e6, take: 0.2, margin: 80, rate: 0, cad: 'q' },
  ]},
];

export const DEFAULT_ENGINE: EngineSettings = { cycle: [9, 5, 3], ramp: 3, platCycle: 9, platRamp: 12 };

// ── Formatting ───────────────────────────────────────────────────────
export function fmtR(n: number): string {
  const s = n < 0 ? '-' : '';
  n = Math.abs(n);
  if (n >= 1e9) return `${s}R${(n / 1e9).toFixed(2)}bn`;
  if (n >= 1e6) return `${s}R${(n / 1e6).toFixed(2)}m`;
  if (n >= 1e3) return `${s}R${(n / 1e3).toFixed(0)}k`;
  return `${s}R${Math.round(n)}`;
}

export function perClientGP(t: Tier): number {
  return t.volume * 12 * (t.take / 100) * (t.margin / 100);
}

function addedAt(t: Tier, month: number, mult: number): number {
  const r = t.rate * mult;
  if (r <= 0) return 0;
  if (t.cad === 'm') return r;
  return (month - 1) % 3 === 0 ? r : 0;
}

export function simulate(verticals: Vertical[], eng: EngineSettings, mult: number, horizon: number): SimResult {
  const H = horizon;
  const gp = new Array(H).fill(0);
  const rev = new Array(H).fill(0);
  const vol = new Array(H).fill(0);
  const per: Record<string, VerticalResult> = {};

  for (const v of verticals) {
    let exitVol = 0, exitRev = 0, exitGP = 0, exitClients = 0;
    v.tiers.forEach((t, ti) => {
      const cycle = v.isPlatform ? eng.platCycle : eng.cycle[ti];
      const ramp = v.isPlatform ? eng.platRamp : eng.ramp;
      const take = t.take / 100;
      const margin = t.margin / 100;
      for (let m = 1; m <= H; m++) {
        let vsum = 0;
        for (let a = 1; a <= m; a++) {
          const added = addedAt(t, a, mult);
          if (!added) continue;
          const gL = a + cycle;
          if (m < gL) continue;
          const frac = Math.min(1, (m - gL + 1) / Math.max(1, ramp));
          vsum += added * frac * t.volume;
        }
        const r = vsum * take;
        const g = r * margin;
        vol[m - 1] += vsum;
        rev[m - 1] += r;
        gp[m - 1] += g;
        if (m === H) { exitVol += vsum; exitRev += r; exitGP += g; }
      }
      for (let a = 1; a <= H; a++) {
        const added = addedAt(t, a, mult);
        if (added && H >= a + cycle) exitClients += added;
      }
    });
    per[v.key] = { name: v.name, vol: exitVol * 12, rev: exitRev * 12, gp: exitGP * 12, clients: exitClients };
  }

  const y = (i: number) => gp.slice(i * 12, i * 12 + 12).reduce((a, b) => a + b, 0);
  return {
    gp, rev, vol, per,
    exitGP: gp[H - 1] * 12,
    exitVol: vol[H - 1] * 12,
    exitRev: rev[H - 1] * 12,
    y1: y(0), y2: y(1), y3: y(2),
    totalVol: vol.reduce((a, b) => a + b, 0),
    exitClients: Object.values(per).reduce((a, p) => a + p.clients, 0),
  };
}
