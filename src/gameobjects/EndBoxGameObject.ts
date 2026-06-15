import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config/constants';
import { BoxConfig } from '../types/game';

export default class EndBoxGameObject extends Phaser.GameObjects.Container {
  private boxBg: Phaser.GameObjects.Rectangle;
  private boxBorder: Phaser.GameObjects.Rectangle;
  private labelText: Phaser.GameObjects.Text;
  private hintText: Phaser.GameObjects.Text;
  private boxes: BoxConfig[];
  private isOpened: boolean = false;
  private isInZone: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, boxes: BoxConfig[]) {
    super(scene, x, y);
    this.boxes = boxes;

    const width = GAME_CONFIG.endBoxWidth;
    const height = GAME_CONFIG.endBoxHeight;

    this.boxBg = scene.add.rectangle(0, 0, width, height, COLORS.uiPanel);
    this.boxBorder = scene.add.rectangle(0, 0, width, height, COLORS.uiBorder);
    this.boxBorder.setStrokeStyle(3, COLORS.uiBorder);
    this.boxBorder.isFilled = false;

    this.labelText = scene.add.text(0, -10, '端盒', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    this.labelText.setOrigin(0.5);

    this.hintText = scene.add.text(0, 15, `${boxes.length}件 · 点击拆盒`, {
      fontSize: '12px',
      color: '#8888aa'
    });
    this.hintText.setOrigin(0.5);

    const seriesDots = this.createSeriesDots(width, height);
    this.add([this.boxBg, this.boxBorder, this.labelText, this.hintText, ...seriesDots]);

    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerdown', this.handleClick, this);

    scene.add.existing(this);
  }

  private createSeriesDots(boxWidth: number, boxHeight: number): Phaser.GameObjects.Rectangle[] {
    const dots: Phaser.GameObjects.Rectangle[] = [];
    const dotSize = 8;
    const startX = -boxWidth / 2 + 15;
    const startY = boxHeight / 2 - 15;
    const spacing = 14;

    this.boxes.slice(0, 6).forEach((box, index) => {
      const seriesConfig = this.getSeriesColor(box.seriesId);
      const dot = this.scene.add.rectangle(
        startX + (index % 6) * spacing,
        startY,
        dotSize,
        dotSize,
        box.isHidden ? COLORS.warning : seriesConfig.color
      );
      dot.setStrokeStyle(1, box.isHidden ? 0x000000 : seriesConfig.borderColor);
      dots.push(dot);
    });

    return dots;
  }

  private getSeriesColor(seriesId: string): { color: number; borderColor: number } {
    const colors: Record<string, { color: number; borderColor: number }> = {
      LABUBU: { color: 0xff6b9d, borderColor: 0xff4081 },
      DIMOO: { color: 0x4fc3f7, borderColor: 0x0288d1 },
      MOLLY: { color: 0xffd54f, borderColor: 0xffa000 },
      SKULLPANDA: { color: 0xba68c8, borderColor: 0x7b1fa2 },
      HIDDEN: { color: 0xffd700, borderColor: 0xffa000 }
    };
    return colors[seriesId] || { color: 0x888888, borderColor: 0x666666 };
  }

  private handleClick(): void {
    if (this.isOpened || !this.isInZone) {
      if (!this.isInZone) {
        this.showNotInZoneHint();
      }
      return;
    }

    this.openBox();
  }

  private showNotInZoneHint(): void {
    this.hintText.setText('请先拖到拆盒区!');
    this.hintText.setColor('#f87171');
    this.scene.time.delayedCall(1500, () => {
      this.hintText.setText(`${this.boxes.length}件 · 点击拆盒`);
      this.hintText.setColor('#8888aa');
    });
  }

  private openBox(): void {
    this.isOpened = true;
    this.disableInteractive();

    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 300,
      ease: 'Back.in',
      onComplete: () => {
        this.emit('boxopened', this.boxes, this.x, this.y);
        this.destroy();
      }
    });
  }

  public setInZone(inZone: boolean): void {
    this.isInZone = inZone;
    if (inZone) {
      this.boxBorder.setStrokeStyle(4, COLORS.unpackZoneBorder);
      this.hintText.setColor('#4ade80');
      this.hintText.setText('✓ 点击拆盒');
    } else {
      this.boxBorder.setStrokeStyle(3, COLORS.uiBorder);
      this.hintText.setColor('#8888aa');
      this.hintText.setText(`${this.boxes.length}件 · 点击拆盒`);
    }
  }

  public getIsOpened(): boolean {
    return this.isOpened;
  }

  public getIsInZone(): boolean {
    return this.isInZone;
  }

  public getBoxes(): BoxConfig[] {
    return this.boxes;
  }
}
