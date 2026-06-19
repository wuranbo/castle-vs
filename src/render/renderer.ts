import { FIELD_LENGTH, UNIT_STATS } from '../engine/data';
import type { GameState, Side, Unit, UnitType } from '../engine/types';
import { sprite } from './sprites';

export const CANVAS_W = 420;
export const CANVAS_H = 520;

const CASTLE_ZONE = 44; // 画布上下两端城堡区高度
const FIELD_TOP = CASTLE_ZONE;
const FIELD_BOTTOM = CANVAS_H - CASTLE_ZONE;

const SIDE_COLOR: Record<Side, string> = { player: '#4da3ff', enemy: '#ff6b57' };
const SIDE_DARK: Record<Side, string> = { player: '#2b6cb0', enemy: '#b03a2b' };

// 单位贴图绘制高度（像素），宽度按 SVG 64:80 比例换算
const UNIT_H: Record<UnitType, number> = { soldier: 32, archer: 32, cavalry: 36, siege: 38 };
const UNIT_ASPECT = 64 / 80;

function posToY(pos: number): number {
  // pos 0 = 我方城堡（底部），FIELD_LENGTH = 敌方城堡（顶部）
  return FIELD_BOTTOM - (pos / FIELD_LENGTH) * (FIELD_BOTTOM - FIELD_TOP);
}

function laneX(unit: Unit): number {
  // 用 id 散布到视觉车道上，纯展示用，不影响逻辑
  return 70 + ((unit.id * 53) % 280);
}

function drawCastle(ctx: CanvasRenderingContext2D, side: Side): void {
  const w = 150;
  const h = 100;
  const x = CANVAS_W / 2 - w / 2;
  const img = sprite('castle', side);
  if (img) {
    if (side === 'enemy') {
      // 敌方城堡在顶部，垂直翻转使城垛朝向战场（向下）
      ctx.save();
      ctx.translate(0, h - 6);
      ctx.scale(1, -1);
      ctx.drawImage(img, x, 0, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(img, x, CANVAS_H - h + 6, w, h);
    }
  } else {
    // 贴图未就绪时的回退
    const y = side === 'enemy' ? 6 : CANVAS_H - CASTLE_ZONE + 6;
    ctx.fillStyle = SIDE_DARK[side];
    ctx.fillRect(110, y, 200, CASTLE_ZONE - 12);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(side === 'enemy' ? '敌方城堡' : '我方城堡', CANVAS_W / 2, side === 'enemy' ? 18 : CANVAS_H - 8);
}

function drawUnit(ctx: CanvasRenderingContext2D, u: Unit, t: number): void {
  const stats = UNIT_STATS[u.type];
  const x = laneX(u);
  const baseY = posToY(u.pos);
  const h = UNIT_H[u.type];
  const w = h * UNIT_ASPECT;

  // 行军起伏（视觉动画，与逻辑无关）
  const bob = Math.sin(t / 150 + u.id * 1.3) * 1.8;
  // 攻击后摇：cooldown 刚被重置时为 1，随后回落
  const phase = stats.attackInterval > 0 ? u.cooldown / stats.attackInterval : 0;
  const recent = phase > 0.55 ? (phase - 0.55) / 0.45 : 0;
  const faceDir = u.side === 'player' ? -1 : 1; // 屏幕上指向敌方城堡的方向
  const lunge = recent * 5 * faceDir;

  const y = baseY + bob + lunge;

  // 落地阴影
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(x, baseY + h / 2 - 2, w * 0.42, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const img = sprite(u.type, u.side);
  if (img) {
    const pop = 1 + recent * 0.12;
    const dw = w * pop;
    const dh = h * pop;
    if (u.side === 'enemy') {
      // 敌方单位垂直翻转，面向我方
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, -1);
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    } else {
      ctx.drawImage(img, x - dw / 2, y - dh / 2, dw, dh);
    }
  } else {
    ctx.fillStyle = SIDE_COLOR[u.side];
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 血条
  const ratio = Math.max(0, u.hp / u.maxHp);
  const barW = Math.max(18, w);
  const barY = baseY - h / 2 - 6;
  ctx.fillStyle = '#222a36';
  ctx.fillRect(x - barW / 2, barY, barW, 3);
  ctx.fillStyle = ratio > 0.4 ? '#5ad17a' : '#e8c14a';
  ctx.fillRect(x - barW / 2, barY, barW * ratio, 3);
}

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  const t = performance.now();
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // 战场底色
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#2a1d22');
  grad.addColorStop(0.5, '#1d2330');
  grad.addColorStop(1, '#1b2538');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // 中线
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, (FIELD_TOP + FIELD_BOTTOM) / 2);
  ctx.lineTo(CANVAS_W - 20, (FIELD_TOP + FIELD_BOTTOM) / 2);
  ctx.stroke();

  drawCastle(ctx, 'enemy');
  drawCastle(ctx, 'player');

  // 按屏幕纵深排序，靠下的后画，叠压更自然
  const ordered = [...state.units].sort((a, b) => posToY(b.pos) - posToY(a.pos));
  for (const u of ordered) drawUnit(ctx, u, t);
}
