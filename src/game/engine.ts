import type { FacilityType, GameState, Nation, Resources } from './types';
import * as R from './rules';

export function rng(seed: number): [number, number] {
  // mulberry32
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, (seed + 0x6d2b79f5) | 0];
}

export function newNation(name: string): Nation {
  return { name, res: { ...R.START_RES }, grid: Array(R.GRID_SIZE * R.GRID_SIZE).fill(null), population: 0, techPoints: 0 };
}
export function newGame(seed = Date.now() % 1e9): GameState {
  return { turn: 1, actionsLeft: R.ACTIONS_PER_TURN, player: newNation('日本'), rival: newNation('ライバル国'), log: ['月面基地建設レース開始！ 36か月で最高の基地を作ろう。'], finished: false, seed };
}

export const count = (n: Nation, t: FacilityType) => n.grid.filter((g) => g === t).length;
export const powerBalance = (n: Nation) => n.grid.reduce((s, g) => s + (g ? R.FACILITIES[g].power : 0), 0);
export const capacity = (n: Nation) => count(n, 'habitat') * R.HABITAT_CAPACITY;
export const techLevel = (n: Nation) => Math.floor(n.techPoints / R.TECH_POINTS_PER_LEVEL);
export const canAfford = (r: Resources, c: Resources) => r.money >= c.money && r.materials >= c.materials && r.staff >= c.staff;
const pay = (r: Resources, c: Resources): Resources => ({ money: r.money - c.money, materials: r.materials - c.materials, staff: r.staff - c.staff });

export function score(n: Nation) {
  const base = n.grid.reduce((s, g) => s + (g ? R.FACILITIES[g].score : 0), 0);
  const pop = n.population * R.SCORE_PER_POP;
  const tech = techLevel(n) * R.SCORE_PER_TECH_LEVEL;
  return { base, pop, tech, total: base + pop + tech };
}

export function build(n: Nation, t: FacilityType, tile: number): Nation | null {
  if (n.grid[tile] !== null || !canAfford(n.res, R.FACILITIES[t].cost)) return null;
  const grid = [...n.grid]; grid[tile] = t;
  return { ...n, grid, res: pay(n.res, R.FACILITIES[t].cost) };
}
export function research(n: Nation): Nation | null {
  if (!canAfford(n.res, R.RESEARCH_COST)) return null;
  return { ...n, res: pay(n.res, R.RESEARCH_COST), techPoints: n.techPoints + R.RESEARCH_POINTS };
}

/** 月次収入・生産。電力不足なら生産半減。技術レベルごとに資金+10%。 */
export function produce(n: Nation): Nation {
  const eff = powerBalance(n) < 0 ? 0.5 : 1;
  const lvl = techLevel(n);
  const money = Math.round((R.BASE_INCOME.money + count(n, 'launch') * 10 * eff) * (1 + 0.1 * lvl));
  const materials = Math.round(R.BASE_INCOME.materials + count(n, 'mine') * 8 * eff);
  const staff = R.BASE_INCOME.staff + Math.floor(count(n, 'launch') * 2 * eff);
  const tech = Math.floor(count(n, 'lab') * 4 * eff);
  const migrants = Math.max(count(n, 'launch') * 2, count(n, 'habitat') > 0 ? 1 : 0);
  const population = Math.min(capacity(n), n.population + migrants);
  return { ...n, res: { money: n.res.money + money, materials: n.res.materials + materials, staff: n.res.staff + staff }, techPoints: n.techPoints + tech, population };
}

/** CPU: 簡単なヒューリスティック */
export function cpuAct(n: Nation, actions = R.ACTIONS_PER_TURN): { nation: Nation; did: string[] } {
  const did: string[] = [];
  for (let i = 0; i < actions; i++) {
    const tile = n.grid.indexOf(null);
    const want: FacilityType[] = [];
    if (tile >= 0) {
      if (powerBalance(n) < 2) want.push('power');
      if (count(n, 'mine') < 2) want.push('mine');
      if (n.population >= capacity(n) - 1) want.push('habitat');
      if (count(n, 'launch') < Math.max(1, count(n, 'habitat') / 2)) want.push('launch');
      if (count(n, 'lab') < 2) want.push('lab');
      want.push('habitat', 'mine');
    }
    let next: Nation | null = null;
    for (const t of want) { next = build(n, t, tile); if (next) { did.push(`${R.FACILITIES[t].name}を建設`); break; } }
    if (!next && n.res.money > 80) { next = research(n); if (next) did.push('研究に投資'); }
    if (!next) break;
    n = next;
  }
  return { nation: n, did };
}

export interface GameEvent { text: string; apply: (n: Nation) => Nation }
export const EVENTS: GameEvent[] = [
  { text: '☀️ 太陽フレア！ 資材10と人材1を失った', apply: (n) => ({ ...n, res: { ...n.res, materials: Math.max(0, n.res.materials - 10), staff: Math.max(0, n.res.staff - 1) } }) },
  { text: '💰 政府の追加予算 +60資金', apply: (n) => ({ ...n, res: { ...n.res, money: n.res.money + 60 } }) },
  { text: '💥 建設事故…資金30を失った', apply: (n) => ({ ...n, res: { ...n.res, money: Math.max(0, n.res.money - 30) } }) },
  { text: '🧊 氷の鉱脈を発見！ 資材+30', apply: (n) => ({ ...n, res: { ...n.res, materials: n.res.materials + 30 } }) },
  { text: '🎓 優秀な研究者が志願 人材+2・技術+5', apply: (n) => ({ ...n, res: { ...n.res, staff: n.res.staff + 2 }, techPoints: n.techPoints + 5 }) },
];
export const EVENT_CHANCE = 0.35;

export function playerBuild(s: GameState, t: FacilityType, tile: number): GameState {
  if (s.finished || s.actionsLeft <= 0) return s;
  const p = build(s.player, t, tile);
  if (!p) return s;
  return { ...s, player: p, actionsLeft: s.actionsLeft - 1, log: [`${R.FACILITIES[t].name}を建設した`, ...s.log] };
}
export function playerResearch(s: GameState): GameState {
  if (s.finished || s.actionsLeft <= 0) return s;
  const p = research(s.player);
  if (!p) return s;
  return { ...s, player: p, actionsLeft: s.actionsLeft - 1, log: ['研究に投資した (技術+' + R.RESEARCH_POINTS + ')', ...s.log] };
}

/** プレイヤー行動終了 → CPU → イベント → 生産 → 次ターン */
export function endTurn(s: GameState): GameState {
  if (s.finished) return s;
  const log: string[] = [];
  const cpu = cpuAct(s.rival);
  let rival = cpu.nation, player = s.player, seed = s.seed, r: number;
  log.push(`【${s.turn}か月目】ライバル国: ${cpu.did.join('、') || '様子見'}`);
  for (const who of ['player', 'rival'] as const) {
    [r, seed] = rng(seed);
    if (r < EVENT_CHANCE) {
      let i: number; [i, seed] = rng(seed);
      const ev = EVENTS[Math.floor(i * EVENTS.length)];
      if (who === 'player') { player = ev.apply(player); log.push('あなた: ' + ev.text); }
      else { rival = ev.apply(rival); log.push('ライバル国: ' + ev.text); }
    }
  }
  player = produce(player); rival = produce(rival);
  const finished = s.turn >= R.MAX_TURNS;
  if (finished) log.push('🏁 36か月が経過！ 結果発表');
  return { ...s, player, rival, seed, turn: finished ? s.turn : s.turn + 1, actionsLeft: R.ACTIONS_PER_TURN, finished, log: [...log.reverse(), ...s.log].slice(0, 60) };
}

const KEY = 'moon-base-race-save';
export const save = (s: GameState) => localStorage.setItem(KEY, JSON.stringify(s));
export function load(): GameState | null { try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch { return null; } }
export const clearSave = () => localStorage.removeItem(KEY);
