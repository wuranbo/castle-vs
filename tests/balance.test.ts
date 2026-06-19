import { describe, expect, it } from 'vitest';
import { runBattle } from '../src/engine/level';
import type { Command } from '../src/engine/types';
import { LEVELS } from '../src/levels';

// 每关一份「示范打法」：验证关卡存在可行解，同时防止数值改动后关卡变得无解。
// tick 换算：20 tick = 1 秒；金币 ×10 存储，每 tick +2。

function p(atTick: number, building: Command['building']): Command {
  return { atTick, side: 'player', building };
}

// 节奏要点：金币固定增长，攒着不花 = 浪费生产时间，所以全部贪心早建
const SOLUTIONS: Record<string, Command[]> = {
  // 敌方只有 2 个兵营：双兵营稳线，工坊攻城锤拆城
  lv1: [p(0, 'barracks'), p(250, 'barracks'), p(800, 'workshop'), p(1150, 'range'), p(1650, 'stable')],
  // 敌方弓手海：前排兵营 + 双马厩骑兵吃弓手，工坊收尾
  lv2: [p(0, 'barracks'), p(250, 'barracks'), p(700, 'stable'), p(1200, 'stable'), p(1800, 'workshop')],
  // 敌方步弓混编 + 后期攻城车：均衡阵容（步弓骑齐备）+ 工坊收尾
  lv3: [p(0, 'barracks'), p(250, 'barracks'), p(600, 'range'), p(1100, 'stable'), p(1700, 'workshop')],
};

describe('关卡平衡：示范打法可以获胜', () => {
  for (const level of LEVELS) {
    it(`${level.id} ${level.name}`, () => {
      const state = runBattle(level, SOLUTIONS[level.id]);
      const fails = state.events.filter((e) => e.kind === 'buildFailed' && e.side === 'player');
      expect(fails, '示范打法每一步都应买得起').toEqual([]);
      expect(state.result, `我方 ${state.castleHp.player} vs 敌方 ${state.castleHp.enemy}`).toBe('playerWin');
    });
  }
});
