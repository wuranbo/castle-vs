import type { GameState } from './types';

/** FNV-1a 32 位哈希，覆盖会影响战斗演化的全部状态，用于确定性校验 */
export function hashState(s: GameState): number {
  const parts: (number | string)[] = [
    s.tick,
    s.gold.player,
    s.gold.enemy,
    s.castleHp.player,
    s.castleHp.enemy,
    s.nextId,
    s.result,
  ];
  for (const b of s.buildings) parts.push(b.id, b.side, b.type, b.builtAt);
  for (const u of s.units) parts.push(u.id, u.side, u.type, u.pos, u.hp, u.cooldown);
  parts.push(...s.staging.player, ...s.staging.enemy);
  const str = parts.join('|');
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
