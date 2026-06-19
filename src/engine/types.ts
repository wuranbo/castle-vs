export type Side = 'player' | 'enemy';
export type UnitType = 'soldier' | 'archer' | 'cavalry' | 'siege';
export type BuildingType = 'barracks' | 'range' | 'stable' | 'workshop';

export interface UnitStats {
  /** 显示名 */
  name: string;
  hp: number;
  damage: number;
  /** 攻击间隔（tick） */
  attackInterval: number;
  /** 射程（逻辑单位） */
  range: number;
  /** 移动速度（逻辑单位/tick） */
  speed: number;
  /** false 表示只攻击城堡（攻城车） */
  targetsUnits: boolean;
  /** 限定可攻击的单位类型（骑兵只打后排），不设则全部可打 */
  targetTypes?: UnitType[];
  bonusVs?: UnitType;
  bonusMultiplier?: number;
}

export interface BuildingStats {
  name: string;
  /** 造价（金币 ×10） */
  cost: number;
  /** 出兵间隔（tick） */
  spawnInterval: number;
  unit: UnitType;
}

export interface Unit {
  id: number;
  side: Side;
  type: UnitType;
  pos: number;
  hp: number;
  maxHp: number;
  cooldown: number;
}

export interface Building {
  id: number;
  side: Side;
  type: BuildingType;
  builtAt: number;
}

export interface Command {
  atTick: number;
  side: Side;
  building: BuildingType;
}

export type BattleResult = 'ongoing' | 'playerWin' | 'enemyWin' | 'draw';

export type BattleEvent =
  | { tick: number; kind: 'build'; side: Side; building: BuildingType }
  | { tick: number; kind: 'buildFailed'; side: Side; building: BuildingType; reason: 'gold' | 'slots' }
  | { tick: number; kind: 'death'; side: Side; unit: UnitType }
  | { tick: number; kind: 'end'; result: BattleResult };

export type UnitRecord = Record<UnitType, number>;

export interface SideStats {
  damageToUnits: UnitRecord;
  damageToCastle: UnitRecord;
  losses: UnitRecord;
  spawned: UnitRecord;
}

export interface GameState {
  tick: number;
  /** 金币 ×10 存储，保证整数运算 */
  gold: Record<Side, number>;
  castleHp: Record<Side, number>;
  buildings: Building[];
  units: Unit[];
  nextId: number;
  /** 已生产、等待下一波统一出击的单位 */
  staging: Record<Side, UnitType[]>;
  result: BattleResult;
  events: BattleEvent[];
  stats: Record<Side, SideStats>;
  /** 每秒采样一次的双方城堡血量，用于战后曲线 */
  hpHistory: { player: number; enemy: number }[];
}

export interface Level {
  id: string;
  name: string;
  playerPool: BuildingType[];
  enemyBuildOrder: { atTick: number; building: BuildingType }[];
  hint: string;
}
