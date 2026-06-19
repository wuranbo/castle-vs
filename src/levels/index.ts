import { RULES_VERSION } from '../engine/data';
import type { Level } from '../engine/types';

// atTick 以 20 tick = 1 秒换算。敌方与玩家同规则：
// 初始 60 金币，每秒 +4。建造时间点必须保证当时买得起（由测试校验）。
export const LEVELS: Level[] = [
  {
    id: 'lv1',
    name: '第一关 · 新兵营',
    rulesVersion: RULES_VERSION,
    seed: 0,
    playerPool: ['barracks', 'range', 'stable', 'workshop'],
    enemyBuildOrder: [
      { atTick: 0, building: 'barracks' },
      { atTick: 400, building: 'barracks' },
    ],
    hint: '敌人只会出士兵。多造兵营顶住兵线，攒钱上工坊，攻城车会径直去拆城堡。',
  },
  {
    id: 'lv2',
    name: '第二关 · 箭雨',
    rulesVersion: RULES_VERSION,
    seed: 0,
    playerPool: ['barracks', 'range', 'stable', 'workshop'],
    enemyBuildOrder: [
      { atTick: 60, building: 'range' },
      { atTick: 420, building: 'range' },
      { atTick: 700, building: 'barracks' },
      { atTick: 1100, building: 'range' },
      { atTick: 1500, building: 'barracks' },
    ],
    hint: '敌人靠弓手海输出。骑兵速度快、对远程双倍伤害，是弓手的天敌。',
  },
  {
    id: 'lv3',
    name: '第三关 · 铁壁',
    rulesVersion: RULES_VERSION,
    seed: 0,
    playerPool: ['barracks', 'range', 'stable', 'workshop'],
    enemyBuildOrder: [
      { atTick: 0, building: 'barracks' },
      { atTick: 360, building: 'range' },
      { atTick: 600, building: 'barracks' },
      { atTick: 1000, building: 'range' },
      { atTick: 2400, building: 'workshop' },
    ],
    hint: '敌人步弓混编，120 秒还会上攻城车。先稳住战线，再找时机反推。',
  },
];
