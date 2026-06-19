import { BUILDING_STATS, CASTLE_HP, TICKS_PER_SEC, UNIT_STATS } from '../engine/data';
import type { GameState, Side, UnitType } from '../engine/types';

const UNIT_ORDER: UnitType[] = ['soldier', 'archer', 'cavalry', 'siege'];
const SIDE_NAME: Record<Side, string> = { player: '我方', enemy: '敌方' };

function fmtTime(tick: number): string {
  const s = Math.floor(tick / TICKS_PER_SEC);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export interface ResultHandlers {
  onRetry: () => void;
  onNext?: () => void;
  onLevels: () => void;
}

function drawHpChart(canvas: HTMLCanvasElement, state: GameState): void {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;
  const pad = 6;
  ctx.fillStyle = '#141a24';
  ctx.fillRect(0, 0, w, h);
  const n = state.hpHistory.length;
  if (n < 2) return;
  const x = (i: number) => pad + (i / (n - 1)) * (w - pad * 2);
  const y = (hp: number) => pad + (1 - hp / CASTLE_HP) * (h - pad * 2);
  for (const [side, color] of [
    ['player', '#4da3ff'],
    ['enemy', '#ff6b57'],
  ] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    state.hpHistory.forEach((p, i) => {
      if (i === 0) ctx.moveTo(x(i), y(p[side]));
      else ctx.lineTo(x(i), y(p[side]));
    });
    ctx.stroke();
  }
}

function statsTable(state: GameState): string {
  const rows = UNIT_ORDER.map((type) => {
    const p = state.stats.player;
    const e = state.stats.enemy;
    const pDmg = p.damageToUnits[type] + p.damageToCastle[type];
    const eDmg = e.damageToUnits[type] + e.damageToCastle[type];
    if (p.spawned[type] + e.spawned[type] === 0) return '';
    return `<tr>
      <td>${UNIT_STATS[type].name}</td>
      <td>${p.spawned[type]} / ${p.losses[type]} / ${pDmg}</td>
      <td>${e.spawned[type]} / ${e.losses[type]} / ${eDmg}</td>
    </tr>`;
  }).join('');
  return `<table class="stats-table">
    <thead><tr><th>单位</th><th>我方 出场/阵亡/伤害</th><th>敌方 出场/阵亡/伤害</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function timeline(state: GameState): string {
  const items = state.events
    .filter((e) => e.kind === 'build')
    .map(
      (e) =>
        `<li class="${e.side}"><span class="t">${fmtTime(e.tick)}</span> ${SIDE_NAME[e.side]}建造 ${
          BUILDING_STATS[e.building].name
        }</li>`,
    )
    .join('');
  return `<ul class="timeline">${items}</ul>`;
}

export function createResultOverlay(state: GameState, handlers: ResultHandlers): HTMLElement {
  const win = state.result === 'playerWin';
  const title = win ? '🏆 胜利！' : state.result === 'draw' ? '平局 · 惜败' : '💥 失败';
  const subtitle =
    state.castleHp.enemy <= 0 || state.castleHp.player <= 0
      ? `${fmtTime(state.tick)} 摧毁城堡`
      : `时间到 · 我方城堡 ${Math.max(0, state.castleHp.player)} vs 敌方 ${Math.max(0, state.castleHp.enemy)}`;

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="panel ${win ? 'win' : 'lose'}">
      <h2>${title}</h2>
      <p class="subtitle">${subtitle}</p>
      <h3>城堡血量曲线</h3>
      <canvas class="hp-chart" width="380" height="110"></canvas>
      <h3>战斗统计</h3>
      ${statsTable(state)}
      <h3>建造时间线</h3>
      ${timeline(state)}
      <div class="result-btns">
        <button class="retry">再试一次</button>
        ${handlers.onNext ? '<button class="next">下一关 ›</button>' : ''}
        <button class="levels">关卡列表</button>
      </div>
    </div>
  `;

  drawHpChart(overlay.querySelector<HTMLCanvasElement>('.hp-chart')!, state);
  overlay.querySelector('.retry')!.addEventListener('click', handlers.onRetry);
  overlay.querySelector('.levels')!.addEventListener('click', handlers.onLevels);
  if (handlers.onNext) overlay.querySelector('.next')!.addEventListener('click', handlers.onNext);
  return overlay;
}
