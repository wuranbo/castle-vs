import { BUILDING_STATS, CASTLE_HP, TICKS_PER_SEC, UNIT_STATS } from '../engine/data';
import type { BuildingType, GameState, Level, Side } from '../engine/types';
import { CANVAS_H, CANVAS_W } from '../render/renderer';
import { spriteUrl } from '../render/sprites';

export interface HudRefs {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  goldEl: HTMLElement;
  timerEl: HTMLElement;
  speedBtn: HTMLButtonElement;
  exitBtn: HTMLButtonElement;
  hpFill: Record<Side, HTMLElement>;
  hpNum: Record<Side, HTMLElement>;
  slots: Record<Side, HTMLElement>;
  buildBtns: Map<BuildingType, HTMLButtonElement>;
}

const UNIT_DESC: Record<BuildingType, string> = {
  barracks: '近战前排',
  range: '远程输出',
  stable: '快·克远程',
  workshop: '只拆城堡',
};

export function createBattleDom(level: Level): HudRefs {
  const root = document.createElement('div');
  root.className = 'battle';
  root.innerHTML = `
    <div class="battle-top">
      <button class="exit-btn" title="退出战斗">✕</button>
      <div class="level-name">${level.name}</div>
      <button class="speed-btn">1x</button>
    </div>
    <div class="castle-row enemy">
      <div class="hp-bar"><div class="hp-fill enemy-fill"></div></div>
      <span class="hp-num enemy-num"></span>
    </div>
    <div class="slots enemy-slots"></div>
    <canvas width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
    <div class="slots player-slots"></div>
    <div class="castle-row player">
      <div class="hp-bar"><div class="hp-fill player-fill"></div></div>
      <span class="hp-num player-num"></span>
    </div>
    <div class="status-row">
      <span class="gold"></span>
      <span class="timer"></span>
    </div>
    <div class="build-btns"></div>
  `;

  const buildBtns = new Map<BuildingType, HTMLButtonElement>();
  const btnRow = root.querySelector('.build-btns')!;
  for (const type of level.playerPool) {
    const b = BUILDING_STATS[type];
    const u = UNIT_STATS[b.unit];
    const btn = document.createElement('button');
    btn.className = 'build-btn';
    btn.dataset.building = type;
    btn.innerHTML = `
      <img class="b-icon" src="${spriteUrl(type, 'player')}" alt="">
      <span class="b-name">${b.name}</span>
      <span class="b-cost">⛁ ${b.cost / 10}</span>
      <span class="b-desc">${u.name}/${b.spawnInterval / TICKS_PER_SEC}s</span>
      <span class="b-desc">${UNIT_DESC[type]}</span>
    `;
    btnRow.appendChild(btn);
    buildBtns.set(type, btn);
  }

  return {
    root,
    canvas: root.querySelector('canvas')!,
    goldEl: root.querySelector('.gold')!,
    timerEl: root.querySelector('.timer')!,
    speedBtn: root.querySelector('.speed-btn')!,
    exitBtn: root.querySelector('.exit-btn')!,
    hpFill: {
      player: root.querySelector('.player-fill')!,
      enemy: root.querySelector('.enemy-fill')!,
    },
    hpNum: {
      player: root.querySelector('.player-num')!,
      enemy: root.querySelector('.enemy-num')!,
    },
    slots: {
      player: root.querySelector('.player-slots')!,
      enemy: root.querySelector('.enemy-slots')!,
    },
    buildBtns,
  };
}

function renderSlots(el: HTMLElement, state: GameState, side: Side): void {
  const buildings = state.buildings.filter((b) => b.side === side);
  let html = '';
  for (let i = 0; i < 5; i++) {
    const b = buildings[i];
    if (!b) {
      html += '<span class="slot empty"></span>';
      continue;
    }
    const stats = BUILDING_STATS[b.type];
    const progress = (((state.tick - b.builtAt) % stats.spawnInterval) / stats.spawnInterval) * 100;
    html += `<span class="slot ${side}"><i style="background-image:url('${spriteUrl(b.type, side)}')"></i><b style="width:${progress}%"></b></span>`;
  }
  el.innerHTML = html;
}

export function updateHud(refs: HudRefs, state: GameState): void {
  const gold = Math.floor(state.gold.player / 10);
  refs.goldEl.textContent = `⛁ ${gold}`;

  const remain = Math.max(0, Math.ceil((180 * TICKS_PER_SEC - state.tick) / TICKS_PER_SEC));
  refs.timerEl.textContent = `${Math.floor(remain / 60)}:${String(remain % 60).padStart(2, '0')}`;

  for (const side of ['player', 'enemy'] as const) {
    const hp = Math.max(0, state.castleHp[side]);
    refs.hpFill[side].style.width = `${(hp / CASTLE_HP) * 100}%`;
    refs.hpNum[side].textContent = `${hp}`;
    renderSlots(refs.slots[side], state, side);
  }

  const playerSlots = state.buildings.reduce((n, b) => n + (b.side === 'player' ? 1 : 0), 0);
  for (const [type, btn] of refs.buildBtns) {
    const affordable = state.gold.player >= BUILDING_STATS[type].cost;
    btn.disabled = !affordable || playerSlots >= 5 || state.result !== 'ongoing';
  }
}
