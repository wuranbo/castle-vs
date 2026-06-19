import type { Level } from '../engine/types';

export function createLevelSelect(
  levels: Level[],
  completed: Set<string>,
  onPlay: (level: Level) => void,
): HTMLElement {
  const root = document.createElement('div');
  root.className = 'level-select';
  root.innerHTML = `
    <h1>Castle VS</h1>
    <p class="tagline">一张地图 · 一套策略 · 一道战术关</p>
    <div class="level-list"></div>
    <p class="footnote">规则：金币每秒 +4，击杀不给钱 · 建筑自动出兵 · 3 分钟内拆掉敌方城堡</p>
  `;
  const list = root.querySelector('.level-list')!;
  for (const level of levels) {
    const card = document.createElement('button');
    card.className = 'level-card';
    const done = completed.has(level.id);
    card.innerHTML = `
      <span class="lv-name">${level.name} ${done ? '<i class="done">✓ 已通关</i>' : ''}</span>
      <span class="lv-hint">${level.hint}</span>
    `;
    card.addEventListener('click', () => onPlay(level));
    list.appendChild(card);
  }
  return root;
}
