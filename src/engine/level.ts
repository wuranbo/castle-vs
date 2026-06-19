import { BATTLE_DURATION_TICKS } from './data';
import { createBattle, step } from './sim';
import type { Command, GameState, Level } from './types';

export function enemyCommands(level: Level): Command[] {
  return level.enemyBuildOrder.map((o) => ({ atTick: o.atTick, side: 'enemy' as const, building: o.building }));
}

/** 按 tick 索引命令；同 tick 内敌方在前、玩家在后，保证确定性 */
export function indexCommands(commands: Command[]): Map<number, Command[]> {
  const sorted = [...commands].sort(
    (a, b) => a.atTick - b.atTick || (a.side === b.side ? 0 : a.side === 'enemy' ? -1 : 1),
  );
  const byTick = new Map<number, Command[]>();
  for (const cmd of sorted) {
    const list = byTick.get(cmd.atTick);
    if (list) list.push(cmd);
    else byTick.set(cmd.atTick, [cmd]);
  }
  return byTick;
}

/** 无头跑完一整局，用于测试与平衡验证 */
export function runBattle(level: Level, playerCommands: Command[]): GameState {
  const state = createBattle();
  const byTick = indexCommands([...enemyCommands(level), ...playerCommands]);
  while (state.result === 'ongoing' && state.tick < BATTLE_DURATION_TICKS) {
    step(state, byTick.get(state.tick) ?? []);
  }
  return state;
}
