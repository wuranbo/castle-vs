import { describe, expect, it } from 'vitest';
import { BUILDING_STATS, GOLD_PER_TICK, MAX_SLOTS, START_GOLD } from '../src/engine/data';
import { hashState } from '../src/engine/hash';
import { runBattle } from '../src/engine/level';
import type { Command } from '../src/engine/types';
import { LEVELS } from '../src/levels';

const playerCommands: Command[] = [
  { atTick: 0, side: 'player', building: 'barracks' },
  { atTick: 500, side: 'player', building: 'range' },
  { atTick: 1200, side: 'player', building: 'stable' },
  { atTick: 2200, side: 'player', building: 'workshop' },
];

describe('确定性', () => {
  it('同关卡同命令流跑两遍，最终状态哈希一致', () => {
    for (const level of LEVELS) {
      const a = runBattle(level, playerCommands);
      const b = runBattle(level, playerCommands);
      expect(hashState(a)).toBe(hashState(b));
      expect(a.result).toBe(b.result);
      expect(a.tick).toBe(b.tick);
    }
  });

  it('事件流也完全一致', () => {
    const a = runBattle(LEVELS[2], playerCommands);
    const b = runBattle(LEVELS[2], playerCommands);
    expect(a.events).toEqual(b.events);
    expect(a.hpHistory).toEqual(b.hpHistory);
  });
});

describe('关卡数据有效性', () => {
  it('敌方预设策略每一步都买得起且不超槽位（按经济曲线验算）', () => {
    for (const level of LEVELS) {
      let gold = START_GOLD;
      let lastTick = 0;
      let slots = 0;
      const order = [...level.enemyBuildOrder].sort((a, b) => a.atTick - b.atTick);
      for (const o of order) {
        gold += (o.atTick - lastTick + 1) * GOLD_PER_TICK; // 命令 tick 当时先发收入再建造
        lastTick = o.atTick + 1;
        const cost = BUILDING_STATS[o.building].cost;
        expect(gold, `${level.id} 在 tick ${o.atTick} 买 ${o.building}`).toBeGreaterThanOrEqual(cost);
        gold -= cost;
        slots++;
        expect(slots, `${level.id} 槽位`).toBeLessThanOrEqual(MAX_SLOTS);
      }
    }
  });

  it('玩家不操作时，每一关敌方都获胜', () => {
    for (const level of LEVELS) {
      const state = runBattle(level, []);
      expect(state.result, level.id).toBe('enemyWin');
    }
  });
});
