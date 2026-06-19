import { describe, expect, it } from 'vitest';
import {
  BATTLE_DURATION_TICKS,
  BUILDING_STATS,
  CASTLE_HP,
  FIELD_LENGTH,
  GOLD_PER_TICK,
  START_GOLD,
  UNIT_STATS,
  WAVE_INTERVAL_TICKS,
} from '../src/engine/data';
import { createBattle, step } from '../src/engine/sim';
import type { GameState, Side, UnitType } from '../src/engine/types';

function run(state: GameState, ticks: number): void {
  for (let i = 0; i < ticks; i++) step(state, []);
}

function addUnit(state: GameState, side: Side, type: UnitType, pos: number): void {
  const stats = UNIT_STATS[type];
  state.units.push({ id: state.nextId++, side, type, pos, hp: stats.hp, maxHp: stats.hp, cooldown: 0 });
}

describe('经济规则', () => {
  it('金币按 tick 固定增长，与战况无关', () => {
    const state = createBattle();
    run(state, 100);
    expect(state.gold.player).toBe(START_GOLD + 100 * GOLD_PER_TICK);
    expect(state.gold.enemy).toBe(START_GOLD + 100 * GOLD_PER_TICK);
  });

  it('建造扣钱；金币不足或槽位满则失败', () => {
    const state = createBattle();
    step(state, [{ atTick: 0, side: 'player', building: 'barracks' }]);
    expect(state.gold.player).toBe(START_GOLD + GOLD_PER_TICK - BUILDING_STATS.barracks.cost);
    expect(state.buildings).toHaveLength(1);

    // 金币不足
    step(state, [{ atTick: 1, side: 'player', building: 'workshop' }]);
    expect(state.events.some((e) => e.kind === 'buildFailed' && e.reason === 'gold')).toBe(true);

    // 槽位满（直接塞满 5 个建筑）
    const full = createBattle();
    full.gold.player = 99999;
    for (let i = 0; i < 5; i++) {
      step(full, [{ atTick: full.tick, side: 'player', building: 'barracks' }]);
    }
    expect(full.buildings).toHaveLength(5);
    step(full, [{ atTick: full.tick, side: 'player', building: 'barracks' }]);
    expect(full.buildings).toHaveLength(5);
    expect(full.events.some((e) => e.kind === 'buildFailed' && e.reason === 'slots')).toBe(true);
  });
});

describe('生产与波次规则', () => {
  it('兵营按间隔产出士兵进集结区，到波次统一出击', () => {
    const state = createBattle();
    step(state, [{ atTick: 0, side: 'player', building: 'barracks' }]);
    const interval = BUILDING_STATS.barracks.spawnInterval;
    run(state, interval); // 处理完 tick=interval，第一个士兵进集结区
    expect(state.staging.player).toEqual(['soldier']);
    expect(state.units).toHaveLength(0);
    run(state, WAVE_INTERVAL_TICKS - state.tick + 1); // 跑完处理第一个波次 tick 的那一步
    // 波次前集结了 interval*2（=240 tick 内两个），波次时全部上场
    expect(state.staging.player).toEqual([]);
    expect(state.units.length).toBeGreaterThan(0);
    expect(state.units.every((u) => u.type === 'soldier')).toBe(true);
    expect(state.stats.player.spawned.soldier).toBe(state.units.length);
  });
});

describe('战斗规则', () => {
  it('骑兵对弓手有双倍伤害（当前数值下一刀击杀）', () => {
    const state = createBattle();
    addUnit(state, 'player', 'cavalry', 5000);
    addUnit(state, 'enemy', 'archer', 5100);
    expect(UNIT_STATS.cavalry.damage * 2).toBeGreaterThanOrEqual(UNIT_STATS.archer.hp);
    step(state, []); // 互相在射程内，第一击
    expect(state.units.some((u) => u.type === 'archer')).toBe(false);
    expect(state.stats.enemy.losses.archer).toBe(1);
  });

  it('骑兵无视近战前排，穿过去攻击后排弓手', () => {
    const state = createBattle();
    addUnit(state, 'player', 'cavalry', 5000);
    addUnit(state, 'enemy', 'soldier', 5100); // 前排贴脸
    addUnit(state, 'enemy', 'archer', 6000); // 后排
    step(state, []);
    const cavalry = state.units.find((u) => u.type === 'cavalry')!;
    const soldier = state.units.find((u) => u.type === 'soldier')!;
    expect(soldier.hp).toBe(UNIT_STATS.soldier.hp); // 骑兵没打士兵
    expect(cavalry.pos).toBeGreaterThan(5000); // 而是继续冲锋
    // 士兵的长矛反制：对骑兵双倍伤害
    expect(cavalry.hp).toBe(UNIT_STATS.cavalry.hp - UNIT_STATS.soldier.damage * 2);
  });

  it('攻城车无视单位，只攻击城堡', () => {
    const state = createBattle();
    addUnit(state, 'player', 'siege', FIELD_LENGTH - 100); // 已贴脸敌方城堡
    addUnit(state, 'enemy', 'soldier', FIELD_LENGTH - 100);
    step(state, []);
    const soldier = state.units.find((u) => u.type === 'soldier')!;
    expect(soldier.hp).toBe(UNIT_STATS.soldier.hp); // 攻城车没有打士兵
    expect(state.castleHp.enemy).toBe(CASTLE_HP - UNIT_STATS.siege.damage);
  });

  it('普通单位无敌兵时会攻击射程内的城堡', () => {
    const state = createBattle();
    addUnit(state, 'player', 'soldier', FIELD_LENGTH - 100);
    step(state, []);
    expect(state.castleHp.enemy).toBe(CASTLE_HP - UNIT_STATS.soldier.damage);
  });

  it('击杀不产生任何金币', () => {
    const state = createBattle();
    addUnit(state, 'player', 'cavalry', 5000);
    addUnit(state, 'enemy', 'archer', 5100);
    run(state, 100);
    expect(state.gold.player).toBe(START_GOLD + 100 * GOLD_PER_TICK);
  });
});

describe('胜负判定', () => {
  it('摧毁城堡立即获胜', () => {
    const state = createBattle();
    state.castleHp.enemy = 10;
    addUnit(state, 'player', 'soldier', FIELD_LENGTH - 100);
    run(state, 60);
    expect(state.result).toBe('playerWin');
    expect(state.events.at(-1)).toMatchObject({ kind: 'end', result: 'playerWin' });
  });

  it('超时比城堡血量', () => {
    const state = createBattle();
    state.castleHp.enemy = 500;
    run(state, BATTLE_DURATION_TICKS);
    expect(state.result).toBe('playerWin');

    const even = createBattle();
    run(even, BATTLE_DURATION_TICKS);
    expect(even.result).toBe('draw');
    expect(even.tick).toBe(BATTLE_DURATION_TICKS);
  });

  it('战斗结束后 step 不再推进', () => {
    const state = createBattle();
    state.castleHp.enemy = 0; // 下一 tick 判定
    step(state, []);
    const endTick = state.tick;
    step(state, []);
    expect(state.tick).toBe(endTick);
  });
});
