// 临时平衡探查脚本，调完数值后删除
import { it } from 'vitest';
import { TICKS_PER_SEC } from '../src/engine/data';
import { enemyCommands, indexCommands } from '../src/engine/level';
import { createBattle, step } from '../src/engine/sim';
import type { Command } from '../src/engine/types';
import { LEVELS } from '../src/levels';

function p(atTick: number, building: Command['building']): Command {
  return { atTick, side: 'player', building };
}

function trace(levelId: string, playerCommands: Command[]): void {
  const level = LEVELS.find((l) => l.id === levelId)!;
  const state = createBattle();
  const byTick = indexCommands([...enemyCommands(level), ...playerCommands]);
  console.log(`\n=== ${level.name} ===`);
  while (state.result === 'ongoing' && state.tick < 3600) {
    step(state, byTick.get(state.tick) ?? []);
    if (state.tick % (15 * TICKS_PER_SEC) === 0 || state.result !== 'ongoing') {
      const count = (side: string) =>
        state.units.filter((u) => u.side === side).map((u) => `${u.type[0]}@${Math.round(u.pos / 100)}`).join(',');
      console.log(
        `t=${(state.tick / TICKS_PER_SEC).toFixed(0).padStart(3)}s 城堡 我${state.castleHp.player} 敌${state.castleHp.enemy} | 我[${count('player')}] | 敌[${count('enemy')}]`,
      );
    }
  }
  console.log(`结果: ${state.result}`);
}

it('playground', () => {
  // 候选 A：双兵营+靶场+马厩+工坊（均衡）
  trace('lv3', [p(0, 'barracks'), p(250, 'barracks'), p(600, 'range'), p(1100, 'stable'), p(1700, 'workshop')]);
  // 候选 B：三兵营+马厩+工坊（士兵海）
  trace('lv3', [p(0, 'barracks'), p(250, 'barracks'), p(500, 'barracks'), p(1000, 'stable'), p(1600, 'workshop')]);
  // 候选 C：双兵营+双靶场+工坊（步弓镜像加强）
  trace('lv3', [p(0, 'barracks'), p(250, 'barracks'), p(600, 'range'), p(950, 'range'), p(1550, 'workshop')]);
});
