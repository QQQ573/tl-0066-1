import Phaser from 'phaser';
import { levels } from '../utils/levelLoader';
import { LevelConfig } from '../types/game';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.registry.set('levels', levels as unknown as Record<number, LevelConfig>);
    this.scene.start('MenuScene');
  }
}
