import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants';
import { LevelConfig } from '../types/game';

export default class MenuScene extends Phaser.Scene {
  private levels: Record<number, LevelConfig> = {};

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.levels = this.registry.get('levels');

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.add.text(GAME_WIDTH / 2, 100, '快闪店理货员', {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 160, 'Flash Store Inventory', {
      fontSize: '20px',
      color: '#8888aa'
    }).setOrigin(0.5);

    const instructions = [
      '🎯 将传送带送来的端盒拖入拆盒区',
      '📦 点击拆盒，散出 4-6 个单盒',
      '🎨 将单盒拖入对应颜色的系列槽位',
      '⏱️ 8 分钟完成 12 批拆摆',
      '⚠️ 错放扣分，连续 2 次错放触发返工',
      '🌟 第三关：隐藏款必须放入隔离槽！'
    ];

    instructions.forEach((text, index) => {
      this.add.text(GAME_WIDTH / 2, 220 + index * 35, text, {
        fontSize: '16px',
        color: '#ccccdd'
      }).setOrigin(0.5);
    });

    this.createLevelButtons();
  }

  private createLevelButtons(): void {
    const buttonY = 480;
    const spacing = 200;
    const startX = GAME_WIDTH / 2 - spacing;

    Object.values(this.levels).forEach((level, index) => {
      const x = startX + index * spacing;

      const buttonBg = this.add.rectangle(x, buttonY, 160, 80, COLORS.uiPanel)
        .setStrokeStyle(3, COLORS.uiBorder)
        .setInteractive({ useHandCursor: true });

      this.add.text(x, buttonY - 15, `第 ${level.levelId} 关`, {
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      this.add.text(x, buttonY + 15, level.levelName, {
        fontSize: '14px',
        color: '#8888aa'
      }).setOrigin(0.5);

      buttonBg.on('pointerover', () => {
        buttonBg.setStrokeStyle(3, COLORS.slotHighlight);
      });

      buttonBg.on('pointerout', () => {
        buttonBg.setStrokeStyle(3, COLORS.uiBorder);
      });

      buttonBg.on('pointerdown', () => {
        this.registry.set('currentLevel', level.levelId);
        this.scene.start('GameScene');
      });
    });
  }
}
