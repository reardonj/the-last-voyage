import 'phaser';
import Boot from "./Scenes/Boot";
import Preloader from "./Scenes/Preloader";
import Hud from './Scenes/Hud';
import Transition from './Scenes/Transition';
import { AudioScene } from './GameData/AudioManager';

const gameConfig: Phaser.Types.Core.GameConfig = {
  width: 1280,
  height: 720,
  type: Phaser.AUTO,
  parent: "content",
  title: "The Last Voyage"
};

export default class Game extends Phaser.Game {
  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);

    this.scene.add(Boot.Name, Boot);
    this.scene.add(Preloader.Name, Preloader);
    this.scene.add(Hud.Name, Hud);
    this.scene.add(Transition.Name, Transition, true);
    this.scene.add(AudioScene.Name, AudioScene);
    this.scene.start(Boot.Name);
  }
}

/**
 * Workaround for inability to scale in Phaser 3.
 * From http://www.emanueleferonato.com/2018/02/16/how-to-scale-your-html5-games-if-your-framework-does-not-feature-a-scale-manager-or-if-you-do-not-use-any-framework/
 */
function resize(): void {
  const canvas = document.querySelector("canvas");
  if (canvas === null) {
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const wratio = width / height;
  const ratio = Number(gameConfig.width) / Number(gameConfig.height);
  if (wratio < ratio) {
    canvas.style.width = width + "px";
    canvas.style.height = (width / ratio) + "px";
  } else {
    canvas.style.width = (height * ratio) + "px";
    canvas.style.height = height + "px";
  }
}

window.onload = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const game = new Game(gameConfig);
  // Uncomment the following two lines if you want the game to scale to fill the entire page, but keep the game ratio.
  resize();
  window.addEventListener("resize", resize, true);
};
