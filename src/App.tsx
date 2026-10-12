import { useEffect, useState } from 'react';
import type { FacilityType, GameState } from './game/types';
import * as E from './game/engine';
import * as R from './game/rules';

export default function App() {
  const [s, setS] = useState<GameState>(() => E.load() ?? E.newGame());
  const [sel, setSel] = useState<FacilityType | null>(null);
  useEffect(() => E.save(s), [s]);
  const restart = () => { E.clearSave(); setS(E.newGame()); setSel(null); };
  const p = s.player, ps = E.score(p), rs = E.score(s.rival);

  if (s.finished) {
    const win = ps.total > rs.total, draw = ps.total === rs.total;
    return (
      <div className="wrap result">
        <h1>{draw ? '引き分け' : win ? '🎉 勝利！' : '😢 敗北…'}</h1>
        <table><thead><tr><th></th><th>あなた</th><th>ライバル国</th></tr></thead><tbody>
          <tr><td>基地</td><td>{ps.base}</td><td>{rs.base}</td></tr>
          <tr><td>人口</td><td>{ps.pop}</td><td>{rs.pop}</td></tr>
          <tr><td>技術</td><td>{ps.tech}</td><td>{rs.tech}</td></tr>
          <tr><th>合計</th><th>{ps.total}</th><th>{rs.total}</th></tr>
        </tbody></table>
        <button className="primary" onClick={restart}>もう一度遊ぶ</button>
      </div>
    );
  }

  const pw = E.powerBalance(p);
  return (
    <div className="wrap">
      <header>
        <h1>🌕 月面基地レース</h1>
        <div>{s.turn} / {R.MAX_TURNS}か月目・残り行動 {s.actionsLeft}</div>
      </header>
      <div className="bar">
        <span>💰資金 {p.res.money}</span><span>🧱資材 {p.res.materials}</span><span>👩‍🚀人材 {p.res.staff}</span>
        <span className={pw < 0 ? 'bad' : ''}>⚡電力 {pw}</span><span>👥人口 {p.population}/{E.capacity(p)}</span>
        <span>🔬技術Lv {E.techLevel(p)} ({p.techPoints}pt)</span>
      </div>
      <div className="score">スコア あなた <b>{ps.total}</b> vs ライバル国 <b>{rs.total}</b>
        <small>（ライバル: 施設{s.rival.grid.filter(Boolean).length}・人口{s.rival.population}・技術Lv{E.techLevel(s.rival)}）</small></div>
      <div className="main">
        <div className="grid">
          {p.grid.map((g, i) => (
            <button key={i} className={'tile' + (g ? ' built' : sel ? ' can' : '')}
              onClick={() => { if (!g && sel) { const n = E.playerBuild(s, sel, i); if (n !== s) { setS(n); setSel(null); } } }}
              title={g ? R.FACILITIES[g].name : ''}>{g ? R.FACILITIES[g].icon : ''}</button>
          ))}
        </div>
        <div className="actions">
          {R.FACILITY_TYPES.map((t) => {
            const f = R.FACILITIES[t], ok = E.canAfford(p.res, f.cost) && s.actionsLeft > 0;
            return <button key={t} disabled={!ok} className={sel === t ? 'sel' : ''} onClick={() => setSel(sel === t ? null : t)}>
              {f.icon} {f.name}<small>💰{f.cost.money} 🧱{f.cost.materials} 👩‍🚀{f.cost.staff} ⚡{f.power > 0 ? '+' : ''}{f.power}<br />{f.desc}・{f.score}点</small></button>;
          })}
          <button disabled={!E.canAfford(p.res, R.RESEARCH_COST) || s.actionsLeft <= 0} onClick={() => setS(E.playerResearch(s))}>
            📚 研究投資<small>💰{R.RESEARCH_COST.money} 👩‍🚀{R.RESEARCH_COST.staff} → 技術+{R.RESEARCH_POINTS}</small></button>
          <button className="primary" onClick={() => { setSel(null); setS(E.endTurn(s)); }}>ターン終了 ▶</button>
          {sel && <p className="hint">空きタイルをタップして{R.FACILITIES[sel].name}を建設</p>}
        </div>
      </div>
      <div className="log">{s.log.map((l, i) => <div key={i}>{l}</div>)}</div>
      <button className="link" onClick={() => confirm('最初からやり直しますか？') && restart()}>最初から</button>
    </div>
  );
}
