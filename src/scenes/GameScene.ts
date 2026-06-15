import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, GAME_CONFIG } from '../config/constants';
import { LevelConfig, GameStats, Slot, BoxConfig } from '../types/game';
import { getLevel, generateBatchBoxes, formatTime } from '../utils/levelLoader';
import EndBoxGameObject from '../gameobjects/EndBoxGameObject';
import SingleBoxGameObject from '../gameobjects/SingleBoxGameObject';

export default class GameScene extends Phaser.Scene {
  private level!: LevelConfig;
  private currentLevelId: number = 1;

  private gameStats!: GameStats;
  private timeRemaining: number = 0;
  private currentBatch: number = 0;
  private consecutiveWrong: number = 0;
  private batchStartTime: number = 0;
  private batchUnpackTimes: number[] = [];

  private _unpackZoneLabel!: Phaser.GameObjects.Text;
  private slotSprites: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private slotOccupied: Map<string, boolean> = new Map();

  private endBoxes: EndBoxGameObject[] = [];
  private singleBoxes: SingleBoxGameObject[] = [];
  private activeEndBox: EndBoxGameObject | null = null;

  private timerText!: Phaser.GameObjects.Text;
  private batchText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private displayScoreText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  private isPaused: boolean = false;
  private isReworking: boolean = false;
  private reworkOverlay!: Phaser.GameObjects.Container;

  private endBoxDragOffsetX: number = 0;
  private endBoxDragOffsetY: number = 0;
  private isDraggingEndBox: boolean = false;
  private draggedEndBox: EndBoxGameObject | null = null;

  constructor() {
    super('GameScene');
  }

  init(): void {
    this.currentLevelId = this.registry.get('currentLevel') || 1;
    this.level = getLevel(this.currentLevelId);
    this.timeRemaining = this.level.gameDuration;
    this.currentBatch = 0;
    this.consecutiveWrong = 0;
    this.batchUnpackTimes = [];
    this.endBoxes = [];
    this.singleBoxes = [];
    this.activeEndBox = null;
    this.isPaused = false;
    this.isReworking = false;
    this.isDraggingEndBox = false;
    this.draggedEndBox = null;

    this.gameStats = {
      totalBatches: this.level.totalBatches,
      completedBatches: 0,
      failedBatches: 0,
      reworks: 0,
      totalUnpackTime: 0,
      averageUnpackSeconds: 0,
      seriesConfusionCount: {},
      score: 0,
      displayScore: 1000,
      wrongPlacements: 0
    };

    this.level.series.forEach(s => {
      this.gameStats.seriesConfusionCount[s.id] = 0;
    });
  }

  create(): void {
    this.createBackground();
    this.createConveyorBelt();
    this.createUnpackZone();
    this.createSlots();
    this.createHUD();
    this.setupInput();
    this.spawnEndBox();

    this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });

    this.batchStartTime = this.time.now;
  }

  private createBackground(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.add.text(GAME_WIDTH / 2, 40, `${this.level.levelName} - 第 ${this.level.levelId} 关`, {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
  }

  private createConveyorBelt(): void {
    const { x, y, width } = this.level.conveyorBelt;
    const height = 100;

    this.add.rectangle(x + width / 2, y + height / 2, width, height, COLORS.conveyor)
      .setStrokeStyle(4, COLORS.conveyorBorder);

    this.add.text(x + 20, y + height / 2, '▶ ▶ ▶ 传送带', {
      fontSize: '14px',
      color: '#8888aa'
    }).setOrigin(0, 0.5);
  }

  private createUnpackZone(): void {
    const { x, y, width, height } = this.level.unpackZone;

    this.add.rectangle(x + width / 2, y + height / 2, width, height, COLORS.unpackZone)
      .setStrokeStyle(3, COLORS.unpackZoneBorder)
      .setAlpha(0.5);

    this._unpackZoneLabel = this.add.text(x + width / 2, y + height / 2, '拆盒区\n将端盒拖到这里', {
      fontSize: '18px',
      color: '#88ccff',
      align: 'center'
    }).setOrigin(0.5);
  }

  private createSlots(): void {
    this.level.slots.forEach((slot: Slot) => {
      const series = this.level.series.find(s => s.id === slot.seriesId)!;

      const slotBg = this.add.rectangle(
        slot.x + slot.width / 2,
        slot.y + slot.height / 2,
        slot.width,
        slot.height,
        COLORS.slotEmpty
      ).setStrokeStyle(3, series.borderColor);

      this.add.text(
        slot.x + slot.width / 2,
        slot.y + slot.height / 2,
        slot.isHidden ? '隔离槽' : series.name,
        {
          fontSize: slot.isHidden ? '14px' : '16px',
          fontStyle: 'bold',
          color: slot.isHidden ? '#ffd700' : '#ffffff'
        }
      ).setOrigin(0.5);

      this.add.rectangle(
        slot.x + slot.width / 2,
        slot.y + slot.height - 8,
        slot.width - 16,
        6,
        series.color
      );

      if (slot.isHidden) {
        this.add.text(
          slot.x + slot.width / 2,
          slot.y - 15,
          '★ 隐藏款',
          {
            fontSize: '12px',
            color: '#ffd700'
          }
        ).setOrigin(0.5);
      }

      this.slotSprites.set(slot.id, slotBg);
      this.slotOccupied.set(slot.id, false);
    });
  }

  private createHUD(): void {
    const hudY = 70;

    this.timerText = this.add.text(100, hudY, `⏱️ ${formatTime(this.timeRemaining)}`, {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff'
    });

    this.batchText = this.add.text(GAME_WIDTH / 2, hudY, `批次: ${this.currentBatch}/${this.level.totalBatches}`, {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff'
    });

    this.scoreText = this.add.text(GAME_WIDTH - 250, hudY, `得分: ${this.gameStats.score}`, {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff'
    });

    this.displayScoreText = this.add.text(GAME_WIDTH - 100, hudY, `陈列: ${this.gameStats.displayScore}`, {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#4ade80'
    });

    this.hintText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '', {
      fontSize: '16px',
      color: '#fbbf24'
    }).setOrigin(0.5);
  }

  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isPaused || this.isReworking) return;

      for (let i = this.endBoxes.length - 1; i >= 0; i--) {
        const endBox = this.endBoxes[i];
        if (endBox.getBounds().contains(pointer.x, pointer.y) && !endBox.getIsOpened()) {
          this.startDraggingEndBox(endBox, pointer);
          break;
        }
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingEndBox && this.draggedEndBox) {
        this.draggedEndBox.x = pointer.x - this.endBoxDragOffsetX;
        this.draggedEndBox.y = pointer.y - this.endBoxDragOffsetY;

        const isInZone = this.isInUnpackZone(this.draggedEndBox.x, this.draggedEndBox.y);
        this.draggedEndBox.setInZone(isInZone);
      }
    });

    this.input.on('pointerup', () => {
      if (this.isDraggingEndBox && this.draggedEndBox) {
        this.stopDraggingEndBox();
      }
    });
  }

  private startDraggingEndBox(endBox: EndBoxGameObject, pointer: Phaser.Input.Pointer): void {
    this.isDraggingEndBox = true;
    this.draggedEndBox = endBox;
    this.endBoxDragOffsetX = pointer.x - endBox.x;
    this.endBoxDragOffsetY = pointer.y - endBox.y;
    endBox.setDepth(50);
  }

  private stopDraggingEndBox(): void {
    if (this.draggedEndBox) {
      const isInZone = this.isInUnpackZone(this.draggedEndBox.x, this.draggedEndBox.y);
      this.draggedEndBox.setInZone(isInZone);
      this.draggedEndBox.setDepth(10);
    }
    this.isDraggingEndBox = false;
    this.draggedEndBox = null;
  }

  private isInUnpackZone(x: number, y: number): boolean {
    const zone = this.level.unpackZone;
    return x >= zone.x && x <= zone.x + zone.width &&
           y >= zone.y && y <= zone.y + zone.height;
  }

  private spawnEndBox(): void {
    if (this.currentBatch >= this.level.totalBatches) return;
    if (this.endBoxes.length > 0 || this.singleBoxes.length > 0) return;

    const boxes = generateBatchBoxes(this.level);
    const endBox = new EndBoxGameObject(
      this, -100, this.level.conveyorBelt.y + 50, boxes
    );

    endBox.on('boxopened', this.handleBoxOpened, this);

    this.endBoxes.push(endBox);
    this.activeEndBox = endBox;
  }

  private handleBoxOpened(boxes: BoxConfig[], x: number, y: number): void {
    const now = this.time.now;
    const unpackTime = (now - this.batchStartTime) / 1000;
    this.batchUnpackTimes.push(unpackTime);

    this.spawnSingleBoxes(boxes, x, y);

    const endBoxIndex = this.endBoxes.findIndex(b => b.getIsOpened());
    if (endBoxIndex > -1) {
      this.endBoxes.splice(endBoxIndex, 1);
    }
    this.activeEndBox = null;

    this.currentBatch++;
    this.batchText.setText(`批次: ${this.currentBatch}/${this.level.totalBatches}`);

    this._unpackZoneLabel.setText('拆盒区\n等待下一批...');
  }

  private spawnSingleBoxes(boxes: BoxConfig[], centerX: number, centerY: number): void {
    const cols = Math.ceil(Math.sqrt(boxes.length));
    const spacing = 75;
    const startX = centerX - ((cols - 1) * spacing) / 2;
    const startY = centerY - ((Math.ceil(boxes.length / cols) - 1) * spacing) / 2;

    boxes.forEach((boxConfig, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const series = this.level.series.find(s => s.id === boxConfig.seriesId)!;

      const singleBox = new SingleBoxGameObject(
        this,
        startX + col * spacing,
        startY + row * spacing,
        series,
        boxConfig.isHidden || false
      );

      singleBox.on('boxdropped', this.handleSingleBoxDropped, this);
      this.singleBoxes.push(singleBox);
    });

    this.batchStartTime = this.time.now;
  }

  private handleSingleBoxDropped(box: SingleBoxGameObject): void {
    if (this.isPaused || this.isReworking) return;

    const targetSlot = this.findTargetSlot(box.x, box.y);

    if (!targetSlot) {
      box.resetPosition();
      return;
    }

    const isOccupied = this.slotOccupied.get(targetSlot.id);

    if (isOccupied) {
      box.showError();
      return;
    }

    const isCorrect = this.checkPlacement(box, targetSlot);

    if (isCorrect) {
      this.handleCorrectPlacement(box, targetSlot);
    } else {
      this.handleWrongPlacement(box, targetSlot);
    }
  }

  private findTargetSlot(x: number, y: number): Slot | null {
    for (const slot of this.level.slots) {
      if (x >= slot.x && x <= slot.x + slot.width &&
          y >= slot.y && y <= slot.y + slot.height) {
        return slot;
      }
    }
    return null;
  }

  private checkPlacement(box: SingleBoxGameObject, slot: Slot): boolean {
    const isHiddenBox = box.getIsHidden();
    const isHiddenSlot = slot.isHidden || false;

    if (this.level.hasHiddenRule) {
      if (isHiddenBox && !isHiddenSlot) {
        return false;
      }
      if (!isHiddenBox && isHiddenSlot) {
        return false;
      }
    }

    return box.getSeriesId() === slot.seriesId;
  }

  private handleCorrectPlacement(box: SingleBoxGameObject, slot: Slot): void {
    this.consecutiveWrong = 0;
    this.slotOccupied.set(slot.id, true);

    const slotSprite = this.slotSprites.get(slot.id);
    if (slotSprite) {
      slotSprite.setStrokeStyle(4, COLORS.success);
    }

    box.placeAt(slot.x + slot.width / 2, slot.y + slot.height / 2);

    this.gameStats.score += GAME_CONFIG.displayScorePerCorrect;
    this.scoreText.setText(`得分: ${this.gameStats.score}`);

    this.showHint('✓ 放置正确！', COLORS.success);

    this.checkBatchComplete();
  }

  private handleWrongPlacement(box: SingleBoxGameObject, slot: Slot): void {
    const boxSeriesId = box.getSeriesId();
    const slotSeriesId = slot.seriesId;

    this.consecutiveWrong++;
    this.gameStats.wrongPlacements++;

    this.gameStats.displayScore -= GAME_CONFIG.displayScorePenalty;
    this.displayScoreText.setText(`陈列: ${this.gameStats.displayScore}`);

    if (box.getIsHidden() && this.level.hasHiddenRule && !slot.isHidden) {
      this.failBatch();
      return;
    }

    const confusionKey = `${boxSeriesId}->${slotSeriesId}`;
    if (!this.gameStats.seriesConfusionCount[confusionKey]) {
      this.gameStats.seriesConfusionCount[confusionKey] = 0;
    }
    this.gameStats.seriesConfusionCount[confusionKey]++;
    this.gameStats.seriesConfusionCount[boxSeriesId]++;

    box.showError();

    if (this.consecutiveWrong >= GAME_CONFIG.consecutiveWrongForRework) {
      this.triggerRework();
    } else {
      this.showHint(`✗ 放错了！系列不匹配`, COLORS.error);
    }
  }

  private triggerRework(): void {
    this.isReworking = true;
    this.consecutiveWrong = 0;
    this.gameStats.reworks++;

    this.showHint(`⚠️ 连续错放！整批返工中...`, COLORS.warning);

    this.createReworkOverlay();

    this.time.delayedCall(GAME_CONFIG.reworkPenaltySeconds * 1000, () => {
      this.resetCurrentBatch();
      this.hideReworkOverlay();
      this.isReworking = false;
      this.showHint('返工完成，请重新摆放', COLORS.warning);
    });
  }

  private createReworkOverlay(): void {
    this.reworkOverlay = this.add.container(0, 0);

    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);

    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '整批返工中...', {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#fbbf24'
    }).setOrigin(0.5);

    const subText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, `耗时 ${GAME_CONFIG.reworkPenaltySeconds} 秒`, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.reworkOverlay.add([overlay, text, subText]);
    this.reworkOverlay.setDepth(200);
  }

  private hideReworkOverlay(): void {
    if (this.reworkOverlay) {
      this.reworkOverlay.destroy();
    }
  }

  private resetCurrentBatch(): void {
    this.singleBoxes.forEach(box => {
      if (!box.getIsPlaced()) {
        box.destroy();
      }
    });

    this.singleBoxes = this.singleBoxes.filter(box => box.getIsPlaced());

    this.slotOccupied.forEach((occupied, slotId) => {
      if (!occupied) return;
      const slot = this.level.slots.find(s => s.id === slotId);
      if (slot) {
        const series = this.level.series.find(s => s.id === slot.seriesId)!;
        const slotSprite = this.slotSprites.get(slotId);
        if (slotSprite) {
          slotSprite.setStrokeStyle(3, series.borderColor);
        }
      }
      this.slotOccupied.set(slotId, false);
    });

    this.singleBoxes.forEach(box => {
      if (box.getIsPlaced()) {
        const matchingSlot = this.level.slots.find(s => s.seriesId === box.getSeriesId() && !this.slotOccupied.get(s.id));
        if (matchingSlot) {
          this.slotOccupied.set(matchingSlot.id, true);
        }
      }
    });

    this.singleBoxes = this.singleBoxes.filter(box => !box.getIsPlaced());

    const unplacedBoxes = this.singleBoxes.filter(b => !b.getIsPlaced());
    const centerX = this.level.unpackZone.x + this.level.unpackZone.width / 2;
    const centerY = this.level.unpackZone.y + this.level.unpackZone.height / 2;

    const cols = Math.ceil(Math.sqrt(unplacedBoxes.length));
    const spacing = 75;
    const startX = centerX - ((cols - 1) * spacing) / 2;
    const startY = centerY - ((Math.ceil(unplacedBoxes.length / cols) - 1) * spacing) / 2;

    unplacedBoxes.forEach((box, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      box.x = startX + col * spacing;
      box.y = startY + row * spacing;
    });
  }

  private failBatch(): void {
    this.gameStats.failedBatches++;
    this.showHint('✗ 隐藏款放错！本批失败！', COLORS.error);

    this.isPaused = true;

    this.time.delayedCall(2000, () => {
      this.clearCurrentBatch();
      this.currentBatch++;
      this.batchText.setText(`批次: ${this.currentBatch}/${this.level.totalBatches}`);
      this.isPaused = false;
      this.checkGameEnd();
    });
  }

  private clearCurrentBatch(): void {
    this.singleBoxes.forEach(box => box.destroy());
    this.singleBoxes = [];

    this.slotOccupied.forEach((_, slotId) => {
      const slot = this.level.slots.find(s => s.id === slotId);
      if (slot) {
        const series = this.level.series.find(s => s.id === slot.seriesId)!;
        const slotSprite = this.slotSprites.get(slotId);
        if (slotSprite) {
          slotSprite.setStrokeStyle(3, series.borderColor);
        }
      }
      this.slotOccupied.set(slotId, false);
    });
  }

  private checkBatchComplete(): void {
    const allPlaced = this.singleBoxes.every(box => box.getIsPlaced());

    if (allPlaced) {
      this.gameStats.completedBatches++;

      const now = this.time.now;
      const batchTime = (now - this.batchStartTime) / 1000;
      this.gameStats.totalUnpackTime += batchTime;

      this.showHint('✓ 本批完成！', COLORS.success);

      this.time.delayedCall(1000, () => {
        this.clearCurrentBatch();
        this.checkGameEnd();
      });
    }
  }

  private checkGameEnd(): void {
    if (this.currentBatch >= this.level.totalBatches || this.timeRemaining <= 0) {
      this.endGame();
    } else {
      this._unpackZoneLabel.setText('拆盒区\n将端盒拖到这里');
      this.spawnEndBox();
      this.batchStartTime = this.time.now;
    }
  }

  private updateTimer(): void {
    if (this.isPaused || this.isReworking) return;

    this.timeRemaining--;
    this.timerText.setText(`⏱️ ${formatTime(this.timeRemaining)}`);

    if (this.timeRemaining <= 60) {
      this.timerText.setColor('#f87171');
    }

    if (this.timeRemaining <= 0) {
      this.endGame();
    }
  }

  private showHint(text: string, color: number): void {
    this.hintText.setText(text);
    this.hintText.setColor(`#${color.toString(16).padStart(6, '0')}`);

    this.time.delayedCall(2000, () => {
      this.hintText.setText('');
    });
  }

  private endGame(): void {
    this.gameStats.totalUnpackTime = this.batchUnpackTimes.reduce((a, b) => a + b, 0);
    this.gameStats.averageUnpackSeconds = this.batchUnpackTimes.length > 0
      ? this.gameStats.totalUnpackTime / this.batchUnpackTimes.length
      : 0;

    this.registry.set('gameStats', this.gameStats);
    this.registry.set('currentLevel', this.level);

    this.scene.start('ResultScene');
  }

  update(_time: number, delta: number): void {
    if (this.isPaused || this.isReworking) return;

    this.endBoxes.forEach(endBox => {
      if (endBox.getIsOpened()) return;
      if (this.isDraggingEndBox && this.draggedEndBox === endBox) return;

      endBox.x += this.level.conveyorBelt.speed * (delta / 1000);

      if (endBox.x > GAME_WIDTH + 100) {
        endBox.destroy();
        const index = this.endBoxes.indexOf(endBox);
        if (index > -1) {
          this.endBoxes.splice(index, 1);
        }
        if (this.activeEndBox === endBox) {
          this.activeEndBox = null;
        }
        this.currentBatch++;
        this.batchText.setText(`批次: ${this.currentBatch}/${this.level.totalBatches}`);
        this.checkGameEnd();
      }
    });
  }
}
