import type { BuildingStats, BuildingType, UnitStats, UnitType } from './types';

export const TICKS_PER_SEC = 20;
export const BATTLE_DURATION_TICKS = 180 * TICKS_PER_SEC;

/** 战场为一维线段：0 = 我方城堡，FIELD_LENGTH = 敌方城堡 */
export const FIELD_LENGTH = 10000;
export const CASTLE_HP = 800;
/** 单位出生点距离己方城堡的偏移 */
export const SPAWN_OFFSET = 300;

/** 金币均为 ×10 存储 */
export const START_GOLD = 600;
export const GOLD_PER_TICK = 2; // 即每秒 4 金币

export const MAX_SLOTS = 5;

/**
 * 波次出兵：建筑产出的单位先进入集结区，每隔 WAVE_INTERVAL_TICKS
 * 双方同时放出一波。军团对军团交战，避免单兵添油被死球逐个点名。
 */
export const WAVE_INTERVAL_TICKS = 15 * 20;

export const UNIT_STATS: Record<UnitType, UnitStats> = {
  soldier: {
    name: '士兵',
    hp: 70,
    damage: 8,
    attackInterval: 20,
    range: 150,
    speed: 20,
    targetsUnits: true,
    bonusVs: 'cavalry',
    bonusMultiplier: 2,
  },
  archer: {
    name: '弓手',
    hp: 35,
    damage: 10,
    attackInterval: 24,
    range: 600,
    speed: 18,
    targetsUnits: true,
  },
  cavalry: {
    name: '骑兵',
    hp: 110,
    damage: 18,
    attackInterval: 20,
    range: 150,
    speed: 32,
    targetsUnits: true,
    // 冲锋：无视近战前排，直取后排远程；没有后排时直奔城堡
    targetTypes: ['archer', 'siege'],
    bonusVs: 'archer',
    bonusMultiplier: 2,
  },
  siege: {
    name: '攻城车',
    hp: 320,
    damage: 50,
    attackInterval: 40,
    range: 150,
    speed: 12,
    targetsUnits: false,
  },
};

export const BUILDING_STATS: Record<BuildingType, BuildingStats> = {
  barracks: { name: '兵营', cost: 500, spawnInterval: 120, unit: 'soldier' },
  range: { name: '靶场', cost: 700, spawnInterval: 160, unit: 'archer' },
  stable: { name: '马厩', cost: 1000, spawnInterval: 240, unit: 'cavalry' },
  workshop: { name: '工坊', cost: 1200, spawnInterval: 300, unit: 'siege' },
};

export const BUILDING_TYPES: BuildingType[] = ['barracks', 'range', 'stable', 'workshop'];
