import 'phaser';
import Boot from "./Scenes/Boot";
import Preloader from "./Scenes/Preloader";
import MainMenu from "./Scenes/MainMenu";
import SplashScreen from "./Scenes/SplashScreen";
import Hud from './Scenes/Hud';
import Transition from './Scenes/Transition';

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
    this.scene.add(SplashScreen.Name, SplashScreen);
    this.scene.add(MainMenu.Name, MainMenu);
    this.scene.add(Hud.Name, Hud);
    this.scene.add(Transition.Name, Transition, true);
    this.scene.start(Boot.Name);
  }
}

window.onload = (): void => {
  const game = new Game(gameConfig);
};
