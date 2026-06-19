import { enemyCommands, indexCommands } from '../engine/level';
import { createBattle, step } from '../engine/sim';
import type { BuildingType, Command, GameState, Level } from '../engine/types';
import { render } from '../render/renderer';
import { createBattleDom, updateHud } from '../ui/hud';
import { GameLoop } from './loop';

export interface BattleCallbacks {
  onExit: () => void;
  onFinished: (state: GameState) => void;
}

export class BattleController {
  private state = createBattle();
  private enemyByTick: Map<number, Command[]>;
  private clickQueue: BuildingType[] = [];
  private loop: GameLoop;
  private ctx: CanvasRenderingContext2D;
  private refs;
  private finished = false;

  constructor(
    level: Level,
    container: HTMLElement,
    private callbacks: BattleCallbacks,
  ) {
    this.enemyByTick = indexCommands(enemyCommands(level));
    this.refs = createBattleDom(level);
    container.replaceChildren(this.refs.root);
    this.ctx = this.refs.canvas.getContext('2d')!;
    this.loop = new GameLoop(
      () => this.tick(),
      () => this.renderFrame(),
    );

    for (const [type, btn] of this.refs.buildBtns) {
      btn.addEventListener('click', () => this.clickQueue.push(type));
    }
    this.refs.speedBtn.addEventListener('click', () => {
      this.loop.speed = this.loop.speed === 1 ? 2 : 1;
      this.refs.speedBtn.textContent = `${this.loop.speed}x`;
    });
    this.refs.exitBtn.addEventListener('click', () => {
      this.loop.stop();
      this.callbacks.onExit();
    });
  }

  start(): void {
    this.renderFrame();
    this.loop.start();
  }

  private tick(): void {
    if (this.state.result !== 'ongoing') return;
    const commands = [...(this.enemyByTick.get(this.state.tick) ?? [])];
    while (this.clickQueue.length > 0) {
      const cmd: Command = { atTick: this.state.tick, side: 'player', building: this.clickQueue.shift()! };
      commands.push(cmd);
    }
    step(this.state, commands);
    if (this.state.result !== 'ongoing' && !this.finished) {
      this.finished = true;
      this.loop.stop();
      this.renderFrame();
      // 稍作停顿让玩家看清最后一帧
      setTimeout(() => this.callbacks.onFinished(this.state), 600);
    }
  }

  private renderFrame(): void {
    render(this.ctx, this.state);
    updateHud(this.refs, this.state);
  }
}
