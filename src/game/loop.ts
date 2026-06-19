const TICK_MS = 50; // 20 tick/秒

/** requestAnimationFrame 驱动的固定 tick 累加器循环；渲染频率与逻辑频率解耦 */
export class GameLoop {
  speed = 1;
  private acc = 0;
  private last = 0;
  private raf = 0;
  private running = false;

  constructor(
    private onTick: () => void,
    private onRender: () => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const frame = (now: number) => {
      if (!this.running) return;
      // 页签切后台再回来时丢弃积压时间，避免追帧卡死
      this.acc = Math.min(this.acc + (now - this.last) * this.speed, 500);
      this.last = now;
      while (this.acc >= TICK_MS) {
        this.onTick();
        this.acc -= TICK_MS;
      }
      this.onRender();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
}
