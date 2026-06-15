import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config/constants';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import ResultScene from './scenes/ResultScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  input: {
    activePointers: 3
  },
  scene: [BootScene, MenuScene, GameScene, ResultScene]
};

new Phaser.Game(config);
