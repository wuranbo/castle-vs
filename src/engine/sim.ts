import {
  BATTLE_DURATION_TICKS,
  BUILDING_STATS,
  CASTLE_HP,
  FIELD_LENGTH,
  GOLD_PER_TICK,
  MAX_SLOTS,
  SPAWN_OFFSET,
  START_GOLD,
  TICKS_PER_SEC,
  UNIT_STATS,
  WAVE_INTERVAL_TICKS,
} from './data';
import type {
  Command,
  GameState,
  Side,
  SideStats,
  Unit,
  UnitRecord,
  UnitType,
} from './types';

function zeroUnitRecord(): UnitRecord {
  return { soldier: 0, archer: 0, cavalry: 0, siege: 0 };
}

function emptySideStats(): SideStats {
  return {
    damageToUnits: zeroUnitRecord(),
    damageToCastle: zeroUnitRecord(),
    losses: zeroUnitRecord(),
    spawned: zeroUnitRecord(),
  };
}

export function createBattle(): GameState {
  return {
    tick: 0,
    gold: { player: START_GOLD, enemy: START_GOLD },
    castleHp: { player: CASTLE_HP, enemy: CASTLE_HP },
    buildings: [],
    units: [],
    nextId: 1,
    staging: { player: [], enemy: [] },
    result: 'ongoing',
    events: [],
    stats: { player: emptySideStats(), enemy: emptySideStats() },
    hpHistory: [{ player: CASTLE_HP, enemy: CASTLE_HP }],
  };
}

function opponent(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player';
}

function applyBuild(state: GameState, cmd: Command): void {
  const stats = BUILDING_STATS[cmd.building];
  const slotsUsed = state.buildings.reduce((n, b) => n + (b.side === cmd.side ? 1 : 0), 0);
  if (slotsUsed >= MAX_SLOTS) {
    state.events.push({ tick: state.tick, kind: 'buildFailed', side: cmd.side, building: cmd.building, reason: 'slots' });
    return;
  }
  if (state.gold[cmd.side] < stats.cost) {
    state.events.push({ tick: state.tick, kind: 'buildFailed', side: cmd.side, building: cmd.building, reason: 'gold' });
    return;
  }
  state.gold[cmd.side] -= stats.cost;
  state.buildings.push({ id: state.nextId++, side: cmd.side, type: cmd.building, builtAt: state.tick });
  state.events.push({ tick: state.tick, kind: 'build', side: cmd.side, building: cmd.building });
}

function spawnUnit(state: GameState, side: Side, type: UnitType): void {
  const stats = UNIT_STATS[type];
  state.units.push({
    id: state.nextId++,
    side,
    type,
    pos: side === 'player' ? SPAWN_OFFSET : FIELD_LENGTH - SPAWN_OFFSET,
    hp: stats.hp,
    maxHp: stats.hp,
    cooldown: 0,
  });
  state.stats[side].spawned[type]++;
}

interface Attack {
  attacker: Unit;
  targetUnit?: Unit;
  targetCastle?: Side;
}

function acquireTarget(state: GameState, u: Unit): Attack | null {
  const stats = UNIT_STATS[u.type];
  const enemySide = opponent(u.side);
  if (stats.targetsUnits) {
    let best: Unit | null = null;
    let bestDist = Infinity;
    for (const other of state.units) {
      if (other.side !== enemySide) continue;
      if (stats.targetTypes && !stats.targetTypes.includes(other.type)) continue;
      const d = Math.abs(other.pos - u.pos);
      if (d <= stats.range && d < bestDist) {
        best = other;
        bestDist = d;
      }
    }
    if (best) return { attacker: u, targetUnit: best };
  }
  const castlePos = u.side === 'player' ? FIELD_LENGTH : 0;
  if (Math.abs(castlePos - u.pos) <= stats.range) {
    return { attacker: u, targetCastle: enemySide };
  }
  return null;
}

function finish(state: GameState): void {
  state.events.push({ tick: state.tick, kind: 'end', result: state.result });
  state.hpHistory.push({ player: state.castleHp.player, enemy: state.castleHp.enemy });
}

/**
 * 推进一个逻辑 tick。commands 是恰好调度在当前 tick 的命令，
 * 顺序必须由调用方保证确定（约定：敌方命令在前，玩家命令在后）。
 */
export function step(state: GameState, commands: Command[]): void {
  if (state.result !== 'ongoing') return;

  state.gold.player += GOLD_PER_TICK;
  state.gold.enemy += GOLD_PER_TICK;

  for (const cmd of commands) applyBuild(state, cmd);

  for (const b of state.buildings) {
    const age = state.tick - b.builtAt;
    if (age > 0 && age % BUILDING_STATS[b.type].spawnInterval === 0) {
      state.staging[b.side].push(BUILDING_STATS[b.type].unit);
    }
  }

  // 波次出击：双方集结区同时清空
  if (state.tick > 0 && state.tick % WAVE_INTERVAL_TICKS === 0) {
    for (const side of ['player', 'enemy'] as const) {
      for (const type of state.staging[side]) spawnUnit(state, side, type);
      state.staging[side] = [];
    }
  }

  // 先收集本 tick 所有攻击再统一结算，保证同 tick 互殴是同时的
  const attacks: Attack[] = [];
  for (const u of state.units) {
    const stats = UNIT_STATS[u.type];
    if (u.cooldown > 0) u.cooldown--;
    const target = acquireTarget(state, u);
    if (target) {
      if (u.cooldown === 0) {
        attacks.push(target);
        u.cooldown = stats.attackInterval;
      }
    } else {
      const dir = u.side === 'player' ? 1 : -1;
      u.pos = Math.max(0, Math.min(FIELD_LENGTH, u.pos + dir * stats.speed));
    }
  }

  for (const a of attacks) {
    const stats = UNIT_STATS[a.attacker.type];
    let dmg = stats.damage;
    if (a.targetUnit && stats.bonusVs === a.targetUnit.type) {
      dmg *= stats.bonusMultiplier ?? 1;
    }
    if (a.targetUnit) {
      const applied = Math.min(dmg, Math.max(a.targetUnit.hp, 0));
      a.targetUnit.hp -= dmg;
      state.stats[a.attacker.side].damageToUnits[a.attacker.type] += applied;
    } else if (a.targetCastle) {
      const applied = Math.min(dmg, state.castleHp[a.targetCastle]);
      state.castleHp[a.targetCastle] -= applied;
      state.stats[a.attacker.side].damageToCastle[a.attacker.type] += applied;
    }
  }

  const survivors: Unit[] = [];
  for (const u of state.units) {
    if (u.hp > 0) {
      survivors.push(u);
    } else {
      state.events.push({ tick: state.tick, kind: 'death', side: u.side, unit: u.type });
      state.stats[u.side].losses[u.type]++;
    }
  }
  state.units = survivors;

  const playerDead = state.castleHp.player <= 0;
  const enemyDead = state.castleHp.enemy <= 0;
  if (playerDead || enemyDead) {
    state.result = playerDead && enemyDead ? 'draw' : playerDead ? 'enemyWin' : 'playerWin';
    finish(state);
    return;
  }

  state.tick++;
  if (state.tick % TICKS_PER_SEC === 0) {
    state.hpHistory.push({ player: state.castleHp.player, enemy: state.castleHp.enemy });
  }

  if (state.tick >= BATTLE_DURATION_TICKS) {
    state.result =
      state.castleHp.player > state.castleHp.enemy
        ? 'playerWin'
        : state.castleHp.enemy > state.castleHp.player
          ? 'enemyWin'
          : 'draw';
    finish(state);
  }
}
