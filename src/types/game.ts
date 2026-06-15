export interface Series {
  id: string;
  name: string;
  color: number;
  borderColor: number;
  isHidden?: boolean;
}

export interface Slot {
  id: string;
  seriesId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isHidden?: boolean;
}

export interface BoxConfig {
  seriesId: string;
  isHidden?: boolean;
}

export interface BatchConfig {
  id: number;
  boxes: BoxConfig[];
  minBoxes: number;
  maxBoxes: number;
}

export interface LevelConfig {
  levelId: number;
  levelName: string;
  totalBatches: number;
  gameDuration: number;
  interferenceRatio: number;
  hasHiddenRule: boolean;
  series: Series[];
  slots: Slot[];
  conveyorBelt: {
    x: number;
    y: number;
    width: number;
    speed: number;
  };
  unpackZone: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface GameStats {
  totalBatches: number;
  completedBatches: number;
  failedBatches: number;
  reworks: number;
  totalUnpackTime: number;
  averageUnpackSeconds: number;
  seriesConfusionCount: Record<string, number>;
  score: number;
  displayScore: number;
  wrongPlacements: number;
}

export interface SingleBox {
  id: string;
  seriesId: string;
  isHidden: boolean;
  sprite: Phaser.GameObjects.Container;
  isDragging: boolean;
}

export interface EndBox {
  id: string;
  boxes: BoxConfig[];
  sprite: Phaser.GameObjects.Container;
  isOpened: boolean;
}
