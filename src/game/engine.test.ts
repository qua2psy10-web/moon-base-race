import { describe, it, expect } from 'vitest';
import { newGame, newNation, build, score, endTurn, produce, cpuAct, playerBuild, research } from './engine';
import { MAX_TURNS } from './rules';

describe('engine', () => {
  it('build pays cost and occupies tile', () => {
    const n = build(newNation('x'), 'power', 0)!;
    expect(n.grid[0]).toBe('power');
    expect(n.res.money).toBe(90);
    expect(build(n, 'mine', 0)).toBeNull();
  });
  it('score sums base, population, tech', () => {
    const n = { ...newNation('x'), grid: ['habitat', 'launch', ...Array(34).fill(null)], population: 4, techPoints: 45 } as any;
    expect(score(n)).toEqual({ base: 22, pop: 12, tech: 30, total: 64 });
  });
  it('produce halves output when power is short', () => {
    let n = { ...newNation('x'), grid: ['mine', 'mine', ...Array(34).fill(null)] } as any;
    expect(produce(n).res.materials - n.res.materials).toBe(5 + 8);
    n = { ...n, grid: ['mine', 'mine', 'power', ...Array(33).fill(null)] };
    expect(produce(n).res.materials - n.res.materials).toBe(5 + 16);
  });
  it('research spends money and adds tech', () => {
    const n = research(newNation('x'))!;
    expect(n.techPoints).toBe(6);
  });
  it('player action limit', () => {
    let s = newGame(1);
    s = playerBuild(s, 'power', 0); s = playerBuild(s, 'mine', 1); s = playerBuild(s, 'mine', 2);
    expect(s.player.grid[2]).toBeNull();
  });
  it('cpu builds something', () => {
    expect(cpuAct(newNation('r')).nation.grid.some(Boolean)).toBe(true);
  });
  it('full game finishes after 36 turns', () => {
    let s = newGame(42);
    for (let i = 0; i < 100 && !s.finished; i++) s = endTurn(s);
    expect(s.finished).toBe(true);
    expect(s.turn).toBe(MAX_TURNS);
    expect(score(s.rival).total).toBeGreaterThan(0);
  });
});
