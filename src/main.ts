import { BattleController } from './game/battle';
import type { Level } from './engine/types';
import { LEVELS } from './levels';
import { createLevelSelect } from './ui/screens';
import { createResultOverlay } from './ui/stats';

const STORAGE_KEY = 'castle-vs-progress';
const app = document.getElementById('app')!;

function loadProgress(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function saveProgress(progress: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...progress]));
}

function showLevels(): void {
  app.replaceChildren(createLevelSelect(LEVELS, loadProgress(), startLevel));
}

function startLevel(level: Level): void {
  const controller = new BattleController(level, app, {
    onExit: showLevels,
    onFinished: (state) => {
      const win = state.result === 'playerWin';
      if (win) {
        const progress = loadProgress();
        progress.add(level.id);
        saveProgress(progress);
      }
      const idx = LEVELS.indexOf(level);
      const next = win && idx >= 0 && idx + 1 < LEVELS.length ? LEVELS[idx + 1] : undefined;
      const overlay = createResultOverlay(state, {
        onRetry: () => startLevel(level),
        onNext: next ? () => startLevel(next) : undefined,
        onLevels: showLevels,
      });
      app.appendChild(overlay);
    },
  });
  controller.start();
}

showLevels();
