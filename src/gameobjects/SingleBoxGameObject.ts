import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config/constants';
import { Series } from '../types/game';

export default class SingleBoxGameObject extends Phaser.GameObjects.Container {
  private boxBg: Phaser.GameObjects.Rectangle;
  private boxBorder: Phaser.GameObjects.Rectangle;
  private labelText: Phaser.GameObjects.Text;
  private series: Series;
  private isHidden: boolean;
  private originalX: number = 0;
  private originalY: number = 0;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private isDragging: boolean = false;
  private isPlaced: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, series: Series, isHidden: boolean = false) {
    super(scene, x, y);
    this.series = series;
    this.isHidden = isHidden;

    const size = GAME_CONFIG.boxSize;

    this.boxBg = scene.add.rectangle(0, 0, size, size, series.color);
    this.boxBorder = scene.add.rectangle(0, 0, size, size, series.borderColor);
    this.boxBorder.setStrokeStyle(3, series.borderColor);
    this.boxBorder.isFilled = false;

    const label = isHidden ? '?' : series.name.charAt(0);
    this.labelText = scene.add.text(0, 0, label, {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.labelText.setOrigin(0.5);

    this.add([this.boxBg, this.boxBorder, this.labelText]);

    this.setSize(size, size);
    this.setInteractive({ useHandCursor: true });

    this.setupDrag();
    scene.add.existing(this);
  }

  private setupDrag(): void {
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isPlaced) return;

      this.isDragging = true;
      this.originalX = this.x;
      this.originalY = this.y;
      this.dragOffsetX = pointer.x - this.x;
      this.dragOffsetY = pointer.y - this.y;
      this.setDepth(100);
      this.scene.tweens.add({
        targets: this,
        scale: 1.1,
        duration: 100,
        ease: 'Power2'
      });
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || this.isPlaced) return;

      this.x = pointer.x - this.dragOffsetX;
      this.y = pointer.y - this.dragOffsetY;
    });

    this.scene.input.on('pointerup', () => {
      if (!this.isDragging || this.isPlaced) return;

      this.isDragging = false;
      this.scene.tweens.add({
        targets: this,
        scale: 1.0,
        duration: 100,
        ease: 'Power2'
      });

      this.emit('boxdropped', this);
    });
  }

  public resetPosition(): void {
    this.scene.tweens.add({
      targets: this,
      x: this.originalX,
      y: this.originalY,
      duration: 200,
      ease: 'Power2'
    });
  }

  public placeAt(x: number, y: number): void {
    this.isPlaced = true;
    this.isDragging = false;
    this.disableInteractive();

    this.scene.tweens.add({
      targets: this,
      x: x,
      y: y,
      scale: 0.9,
      duration: 200,
      ease: 'Back.out'
    });

    this.boxBorder.setStrokeStyle(3, COLORS.success);
  }

  public showError(): void {
    this.scene.cameras.main.shake(100, 0.01);

    this.scene.tweens.add({
      targets: this,
      x: this.originalX,
      y: this.originalY,
      duration: 300,
      ease: 'Elastic.out',
      onComplete: () => {
        this.isDragging = false;
      }
    });

    this.boxBorder.setStrokeStyle(4, COLORS.error);

    this.scene.time.delayedCall(500, () => {
      this.boxBorder.setStrokeStyle(3, this.series.borderColor);
    });
  }

  public getSeriesId(): string {
    return this.series.id;
  }

  public getIsHidden(): boolean {
    return this.isHidden;
  }

  public getIsPlaced(): boolean {
    return this.isPlaced;
  }
}
