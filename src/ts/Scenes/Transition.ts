import GameState, { Events } from "../GameData/GameState";
import { Colours } from "../Utilities";

const FadeOutWidth = 8;
const FadeInWidth = 16;

export default class Transition extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "Transition";
  transitionGraphic: Phaser.GameObjects.Graphics;
  width: number;
  animation: Phaser.Tweens.Tween;

  public create(): void {
    this.width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.transitionGraphic = this.add.graphics();
    let x = 0;
    for (let i = 0; i < FadeOutWidth; i++, x--) {
      this.transitionGraphic.lineStyle(1, Colours.TextTint, i / FadeOutWidth);
      this.transitionGraphic.moveTo(x, 0);
      this.transitionGraphic.lineBetween(x, 0, x, height);
    }

    x = x - this.width;
    this.transitionGraphic.fillStyle(0x000000, 1);
    this.transitionGraphic.fillRect(x, 0, this.width, height);

    for (let i = 0; i < FadeInWidth; i++, x--) {
      this.transitionGraphic.lineStyle(1, Colours.TextTint, 1 - i / FadeInWidth);
      this.transitionGraphic.moveTo(x, 0);
      this.transitionGraphic.lineBetween(x, 0, x, height);
    }

    this.animation = this.tweens.add({
      targets: this.transitionGraphic,
      x: { from: 0, to: this.width * 1 + FadeOutWidth },
      ease: 'Sin',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
      duration: 1000,
      repeat: 0,            // -1: infinity
      yoyo: true,
      paused: true
    });

  }

  public startTransition(duration: number) {
    this.transitionGraphic.x = 0;
    this.transitionGraphic.y = 0;
    this.animation.setTimeScale(1000 / duration);
    this.animation.play();
  }
}
