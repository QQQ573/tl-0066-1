import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants';
import { GameStats, LevelConfig } from '../types/game';

export default class ResultScene extends Phaser.Scene {
  private gameStats!: GameStats;
  private level!: LevelConfig;

  constructor() {
    super('ResultScene');
  }

  init(): void {
    this.gameStats = this.registry.get('gameStats');
    this.level = this.registry.get('currentLevel');
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.add.text(GAME_WIDTH / 2, 60, '营业结束', {
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 100, `${this.level.levelName} - 第 ${this.level.levelId} 关`, {
      fontSize: '20px',
      color: '#8888aa'
    }).setOrigin(0.5);

    this.createStatsPanel();
    this.createConfusionRanking();
    this.createButtons();
  }

  private createStatsPanel(): void {
    const panelX = GAME_WIDTH / 2 - 200;
    const panelY = 140;
    const panelWidth = 400;
    const panelHeight = 280;

    this.add.rectangle(panelX + panelWidth / 2, panelY + panelHeight / 2, panelWidth, panelHeight, COLORS.uiPanel)
      .setStrokeStyle(3, COLORS.uiBorder);

    const stats = [
      { label: '完成批次', value: `${this.gameStats.completedBatches} / ${this.gameStats.totalBatches}`, color: '#4ade80' },
      { label: '失败批次', value: this.gameStats.failedBatches.toString(), color: '#f87171' },
      { label: '返工次数', value: this.gameStats.reworks.toString(), color: '#fbbf24' },
      { label: '平均拆摆秒数', value: `${this.gameStats.averageUnpackSeconds.toFixed(1)}s`, color: '#60a5fa' },
      { label: '总错放次数', value: this.gameStats.wrongPlacements.toString(), color: '#f87171' },
      { label: '最终得分', value: this.gameStats.score.toString(), color: '#fbbf24' },
      { label: '陈列分', value: this.gameStats.displayScore.toString(), color: '#4ade80' }
    ];

    stats.forEach((stat, index) => {
      const y = panelY + 35 + index * 35;

      this.add.text(panelX + 30, y, stat.label, {
        fontSize: '16px',
        color: '#ccccdd'
      });

      this.add.text(panelX + panelWidth - 30, y, stat.value, {
        fontSize: '16px',
        fontStyle: 'bold',
        color: stat.color
      }).setOrigin(1, 0);
    });
  }

  private createConfusionRanking(): void {
    const panelX = GAME_WIDTH / 2 - 250;
    const panelY = 440;
    const panelWidth = 500;
    const panelHeight = 180;

    this.add.rectangle(panelX + panelWidth / 2, panelY + panelHeight / 2, panelWidth, panelHeight, COLORS.uiPanel)
      .setStrokeStyle(3, COLORS.uiBorder);

    this.add.text(panelX + panelWidth / 2, panelY + 25, '最易混系列排行', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#fbbf24'
    }).setOrigin(0.5);

    const confusionEntries = Object.entries(this.gameStats.seriesConfusionCount)
      .filter(([key]) => key.includes('->'))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (confusionEntries.length === 0) {
      this.add.text(panelX + panelWidth / 2, panelY + 90, '🎉 完美！没有混放记录', {
        fontSize: '18px',
        color: '#4ade80'
      }).setOrigin(0.5);
      return;
    }

    confusionEntries.forEach(([key, count], index) => {
      const y = panelY + 60 + index * 25;
      const [from, to] = key.split('->');

      const rankX = panelX + 30;
      this.add.text(rankX, y, `#${index + 1}`, {
        fontSize: '14px',
        fontStyle: 'bold',
        color: index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : index === 2 ? '#f59e0b' : '#9ca3af'
      });

      const fromColor = this.getSeriesColor(from);
      this.add.rectangle(rankX + 50, y - 8, 16, 16, fromColor.color)
        .setStrokeStyle(2, fromColor.borderColor);

      this.add.text(rankX + 70, y, from, {
        fontSize: '14px',
        color: '#ffffff'
      });

      this.add.text(rankX + 140, y, '→', {
        fontSize: '14px',
        color: '#f87171'
      });

      const toColor = this.getSeriesColor(to);
      this.add.rectangle(rankX + 175, y - 8, 16, 16, toColor.color)
        .setStrokeStyle(2, toColor.borderColor);

      this.add.text(rankX + 195, y, to, {
        fontSize: '14px',
        color: '#ffffff'
      });

      this.add.text(panelX + panelWidth - 30, y, `${count} 次`, {
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#f87171'
      }).setOrigin(1, 0);
    });
  }

  private getSeriesColor(seriesId: string): { color: number; borderColor: number } {
    const series = this.level.series.find(s => s.id === seriesId);
    if (series) {
      return { color: series.color, borderColor: series.borderColor };
    }
    return { color: 0x888888, borderColor: 0x666666 };
  }

  private createButtons(): void {
    const buttonY = 650;
    const spacing = 220;
    const startX = GAME_WIDTH / 2 - spacing;

    this.createButton(startX, buttonY, '返回菜单', () => {
      this.scene.start('MenuScene');
    });

    this.createButton(startX + spacing, buttonY, '重新挑战', () => {
      this.scene.start('GameScene');
    });

    if (this.level.levelId < 3) {
      this.createButton(startX + spacing * 2, buttonY, '下一关', () => {
        this.registry.set('currentLevel', this.level.levelId + 1);
        this.scene.start('GameScene');
      });
    }
  }

  private createButton(x: number, y: number, text: string, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 160, 50, COLORS.uiPanel)
      .setStrokeStyle(3, COLORS.uiBorder)
      .setInteractive({ useHandCursor: true });

    const label = this.add.text(0, 0, text, {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([bg, label]);

    bg.on('pointerover', () => {
      bg.setStrokeStyle(3, COLORS.slotHighlight);
    });

    bg.on('pointerout', () => {
      bg.setStrokeStyle(3, COLORS.uiBorder);
    });

    bg.on('pointerdown', onClick);

    return container;
  }
}
