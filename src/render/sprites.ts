import type { BuildingType, Side, UnitType } from '../engine/types';

/**
 * 自包含矢量素材集：每个兵种 / 建筑 / 城堡都是一段按队伍配色参数化的 SVG，
 * 在启动时光栅化为 Image，渲染层即可像贴图一样绘制。
 *
 * 选择内嵌 SVG 而非下载位图包，是因为它零网络依赖、可随 DPR 任意缩放且不引入授权
 * 问题；之后若要换成现成像素包，只需替换下方的 SVG 字符串或改 dataUrl 来源即可，
 * 渲染层无需改动。
 */

interface Palette {
  main: string;
  dark: string;
  light: string;
}

const PALETTE: Record<Side, Palette> = {
  player: { main: '#4da3ff', dark: '#2b6cb0', light: '#cfe7ff' },
  enemy: { main: '#ff6b57', dark: '#b03a2b', light: '#ffd2c8' },
};

const SKIN = '#f0c79b';
const STEEL = '#d3dbe6';
const STEEL_D = '#8b97a8';
const WOOD = '#9c6b35';
const WOOD_D = '#5f3e18';
const STONE = '#c9cedb';
const STONE_D = '#8b91a6';

type SpriteFn = (p: Palette) => string;

/** 所有兵种朝“上”（敌方在顶部），敌方渲染时整体垂直翻转即面向我方。 */
const UNIT_SVG: Record<UnitType, SpriteFn> = {
  soldier: (p) => `
    <ellipse cx="32" cy="40" rx="9" ry="13" fill="${p.dark}"/>
    <rect x="24" y="30" width="16" height="18" rx="7" fill="${p.main}"/>
    <circle cx="32" cy="24" r="8" fill="${SKIN}"/>
    <path d="M22 24a10 10 0 0120 0z" fill="${STEEL}" stroke="${STEEL_D}" stroke-width="1.5"/>
    <rect x="30" y="10" width="4" height="9" rx="2" fill="${p.light}"/>
    <rect x="13" y="26" width="11" height="18" rx="4" fill="${p.light}" stroke="${p.dark}" stroke-width="2"/>
    <circle cx="18.5" cy="35" r="2.5" fill="${p.dark}"/>
    <rect x="44" y="14" width="4" height="30" rx="2" fill="${STEEL}" stroke="${STEEL_D}" stroke-width="1"/>
    <rect x="41" y="40" width="10" height="4" rx="2" fill="${WOOD}"/>`,

  archer: (p) => `
    <ellipse cx="32" cy="40" rx="8" ry="13" fill="${p.dark}"/>
    <path d="M24 48l8-20 8 20z" fill="${p.main}"/>
    <circle cx="32" cy="22" r="7.5" fill="${SKIN}"/>
    <path d="M25 20q-4 -9 4 -14" fill="none" stroke="${p.light}" stroke-width="3" stroke-linecap="round"/>
    <path d="M46 8 Q56 30 46 52" fill="none" stroke="${WOOD}" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="46" y1="8" x2="46" y2="52" stroke="#e8e2d0" stroke-width="1.5"/>
    <line x1="20" y1="30" x2="50" y2="30" stroke="${WOOD_D}" stroke-width="2"/>
    <path d="M16 30l5-3v6z" fill="${STEEL}"/>`,

  cavalry: (p) => `
    <ellipse cx="32" cy="46" rx="18" ry="8" fill="${p.dark}"/>
    <path d="M14 44q-2 -14 12 -16l16 0q12 2 10 16z" fill="#6b5640"/>
    <rect x="16" y="40" width="4" height="12" fill="#4a3a28"/>
    <rect x="44" y="40" width="4" height="12" fill="#4a3a28"/>
    <path d="M44 30q10 -4 12 -12q-6 2 -10 6z" fill="#6b5640"/>
    <circle cx="50" cy="20" r="3" fill="#4a3a28"/>
    <rect x="26" y="14" width="13" height="18" rx="6" fill="${p.main}"/>
    <circle cx="32" cy="12" r="6" fill="${SKIN}"/>
    <path d="M25 12a7 7 0 0114 0z" fill="${STEEL}"/>
    <line x1="22" y1="6" x2="40" y2="34" stroke="${STEEL_D}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M22 6l-4 1 3 3z" fill="${STEEL}"/>`,

  siege: (p) => `
    <ellipse cx="32" cy="50" rx="20" ry="6" fill="rgba(0,0,0,0.18)"/>
    <rect x="12" y="30" width="40" height="16" rx="3" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="2"/>
    <line x1="12" y1="38" x2="52" y2="38" stroke="${WOOD_D}" stroke-width="2"/>
    <circle cx="20" cy="48" r="7" fill="${WOOD_D}"/>
    <circle cx="20" cy="48" r="2.5" fill="${WOOD}"/>
    <circle cx="44" cy="48" r="7" fill="${WOOD_D}"/>
    <circle cx="44" cy="48" r="2.5" fill="${WOOD}"/>
    <line x1="44" y1="34" x2="22" y2="8" stroke="${WOOD_D}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="22" cy="9" r="7" fill="${STONE_D}"/>
    <rect x="46" y="20" width="3" height="14" fill="${p.dark}"/>
    <path d="M49 20h11l-4 4 4 4H49z" fill="${p.main}"/>`,
};

const BUILDING_SVG: Record<BuildingType, SpriteFn> = {
  barracks: (p) => `
    <rect x="10" y="28" width="44" height="28" rx="2" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="2"/>
    <path d="M6 30L32 12l26 18z" fill="${p.main}" stroke="${p.dark}" stroke-width="2"/>
    <rect x="26" y="40" width="12" height="16" rx="1" fill="${WOOD_D}"/>
    <rect x="34" y="6" width="2" height="10" fill="${WOOD_D}"/>
    <path d="M36 6h10l-3 3 3 3H36z" fill="${p.light}"/>`,

  range: (p) => `
    <rect x="10" y="30" width="44" height="26" rx="2" fill="#7d8a5c" stroke="#566042" stroke-width="2"/>
    <path d="M8 32L32 16l24 16z" fill="${p.dark}"/>
    <circle cx="32" cy="42" r="11" fill="#f3efe2"/>
    <circle cx="32" cy="42" r="7.5" fill="${p.light}"/>
    <circle cx="32" cy="42" r="4" fill="#f3efe2"/>
    <circle cx="32" cy="42" r="1.6" fill="${p.main}"/>`,

  stable: (p) => `
    <rect x="9" y="30" width="46" height="26" rx="2" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="2"/>
    <path d="M6 32L32 14l26 18z" fill="${p.main}" stroke="${p.dark}" stroke-width="2"/>
    <path d="M20 56V40q0-8 12-8t12 8v16h-7V42q0-5-5-5t-5 5v14z" fill="${WOOD_D}"/>
    <circle cx="44" cy="24" r="2" fill="${p.light}"/>`,

  workshop: (p) => `
    <rect x="9" y="30" width="46" height="26" rx="2" fill="#6c7480" stroke="#474d57" stroke-width="2"/>
    <path d="M6 32L32 16l26 16z" fill="${p.dark}"/>
    <g fill="${p.light}">
      <circle cx="32" cy="44" r="8"/>
      <rect x="29" y="32" width="6" height="24"/>
      <rect x="20" y="41" width="24" height="6"/>
      <rect x="22" y="34" width="20" height="20" transform="rotate(45 32 44)"/>
    </g>
    <circle cx="32" cy="44" r="3" fill="#474d57"/>`,
};

/** 城堡：城垛在上方（朝向战场）。敌方城堡渲染时垂直翻转，城垛即朝下。 */
const CASTLE_SVG: SpriteFn = (p) => `
  <rect x="14" y="40" width="92" height="34" fill="${STONE}" stroke="${STONE_D}" stroke-width="2"/>
  <g fill="${STONE_D}">
    <rect x="14" y="32" width="12" height="10"/>
    <rect x="34" y="32" width="12" height="10"/>
    <rect x="54" y="32" width="12" height="10"/>
    <rect x="74" y="32" width="12" height="10"/>
    <rect x="94" y="32" width="12" height="10"/>
  </g>
  <rect x="8" y="22" width="22" height="52" fill="${STONE}" stroke="${STONE_D}" stroke-width="2"/>
  <rect x="90" y="22" width="22" height="52" fill="${STONE}" stroke="${STONE_D}" stroke-width="2"/>
  <path d="M8 22l11 -12l11 12z" fill="${p.main}"/>
  <path d="M90 22l11 -12l11 12z" fill="${p.main}"/>
  <rect x="50" y="48" width="20" height="26" rx="9" fill="${p.dark}"/>
  <rect x="55" y="54" width="10" height="20" rx="5" fill="#1a2230"/>
  <rect x="59" y="6" width="2" height="8" fill="${STONE_D}"/>
  <path d="M61 6h12l-4 4 4 4H61z" fill="${p.light}"/>`;

function wrap(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">${inner}</svg>`;
}
function wrapCastle(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">${inner}</svg>`;
}

function dataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export type SpriteKind = UnitType | BuildingType | 'castle';

const images = new Map<string, HTMLImageElement>();

function register(kind: SpriteKind, side: Side, svg: string): void {
  const img = new Image();
  img.src = dataUrl(svg);
  images.set(`${kind}:${side}`, img);
}

for (const side of ['player', 'enemy'] as const) {
  const p = PALETTE[side];
  for (const k in UNIT_SVG) register(k as UnitType, side, wrap(UNIT_SVG[k as UnitType](p)));
  for (const k in BUILDING_SVG) register(k as BuildingType, side, wrap(BUILDING_SVG[k as BuildingType](p)));
  register('castle', side, wrapCastle(CASTLE_SVG(p)));
}

/** 取贴图；未加载完成时返回 null，渲染层可临时跳过或回退。 */
export function sprite(kind: SpriteKind, side: Side): HTMLImageElement | null {
  const img = images.get(`${kind}:${side}`);
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}

/** 供 DOM（建筑槽位 / 按钮图标）直接当作 <img src> 使用。 */
export function spriteUrl(kind: SpriteKind, side: Side): string {
  const svg =
    kind === 'castle'
      ? wrapCastle(CASTLE_SVG(PALETTE[side]))
      : kind in BUILDING_SVG
        ? wrap(BUILDING_SVG[kind as BuildingType](PALETTE[side]))
        : wrap(UNIT_SVG[kind as UnitType](PALETTE[side]));
  return dataUrl(svg);
}
