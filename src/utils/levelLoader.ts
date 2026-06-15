import { LevelConfig, BoxConfig, Series } from '../types/game';
import level1 from '../config/levels/level1.json';
import level2 from '../config/levels/level2.json';
import level3 from '../config/levels/level3.json';

export const levels: Record<number, LevelConfig> = {
  1: level1 as unknown as LevelConfig,
  2: level2 as unknown as LevelConfig,
  3: level3 as unknown as LevelConfig
};

export function getLevel(levelId: number): LevelConfig {
  return levels[levelId];
}

export function generateBatchBoxes(level: LevelConfig): BoxConfig[] {
  const nonHiddenSeries = level.series.filter(s => !s.isHidden);
  const boxCount = Phaser.Math.Between(4, 6);
  const boxes: BoxConfig[] = [];

  for (let i = 0; i < boxCount; i++) {
    const isInterference = Math.random() < level.interferenceRatio;
    let series: Series;

    if (level.hasHiddenRule && Math.random() < 0.1) {
      const hiddenSeries = level.series.find(s => s.isHidden);
      if (hiddenSeries) {
        boxes.push({
          seriesId: hiddenSeries.id,
          isHidden: true
        });
        continue;
      }
    }

    if (isInterference && nonHiddenSeries.length > 1) {
      const otherSeries = nonHiddenSeries.filter(
        s => s.id !== nonHiddenSeries[Math.floor(Math.random() * nonHiddenSeries.length)].id
      );
      series = otherSeries[Math.floor(Math.random() * otherSeries.length)];
    } else {
      series = nonHiddenSeries[Math.floor(Math.random() * nonHiddenSeries.length)];
    }

    boxes.push({
      seriesId: series.id,
      isHidden: false
    });
  }

  return boxes;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
