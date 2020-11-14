import GameState, { Events, InterstellarState } from "../GameData/GameState";
import { Colours, Fonts, Sprites, UI } from "../Utilities";

export default class Interstellar extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "Interstellar";

  sceneState: InterstellarState;
  nextReference: number = 0;
  nextRelative: number = 0;
  lastReference: number = 0;
  lastRelative: number = 0;
  gameState: GameState;

  public create(state: GameState): void {
    this.sceneState = <InterstellarState>state.currentScene[1];
    this.gameState = state;

    this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height, 0x000000, 1);
    const title = this.add.bitmapText(0, 200, Fonts.Proportional24, `Travelling to ${this.sceneState.destination.name}`, 32)
      .setTint(Colours.TextTint)
    UI.centre(0, this.cameras.main.width, title);
    const ship = this.add.image(-50, this.cameras.main.height / 2, Sprites.Ship);

    state.eventSource.emit(Events.UpdateStatus, "Acceleration: 1.00 g");
    state.eventSource.emit(Events.LocationChanged, ["Interstellar Space"]);

    let reference = this.sceneState.travelTime.reference * 365 * 24 * 60;
    let relative = this.sceneState.travelTime.relative * 365 * 24 * 60;

    const farthestOrbit = Object
      .keys(this.sceneState.destination.objects)
      .reduce((max, x) => {
        const obj = this.sceneState.destination.objects[x];
        return obj.type == "planet" ? Math.max(max, obj.orbitalRadius) : max;
      }, 0);

    let initPosition = this.sceneState.destination
      .vectorTo(this.sceneState.origin)
      .normalize();
    // If reentering the same system, use the departure position.
    if (this.sceneState.destination.name == this.sceneState.origin.name) {
      initPosition = this.sceneState.leavingPosition.clone().normalize()
    }

    const nextState = {
      velocity: initPosition.clone().scale(-5),
      position: initPosition.scale(farthestOrbit + 800),
      orientation: initPosition.angle(),
      name: this.sceneState.destination.name
    }
    const animationLength = Math.max(5000, this.sceneState.travelTime.reference * 800);

    this.tweens.addCounter({
      from: 0,
      to: reference,
      ease: 'Linear',
      duration: animationLength,
      onUpdate: (tween: Phaser.Tweens.Tween) => this.nextReference = tween.getValue()
    })

    this.tweens.addCounter({
      from: 0,
      to: relative,
      ease: 'Quad.easeInOut',
      duration: animationLength,
      onUpdate: (tween: Phaser.Tweens.Tween) => this.nextRelative = tween.getValue(),
      onComplete: () => {
        this.gameState.transitionTo(["solar-system", nextState]);
        this.game.events.once("step", () => this.gameState.doStateBasedTransitions(this), this);
      },
      onCompleteScope: this,
    });

    this.tweens.add({
      targets: ship,
      x: { from: -10, to: this.cameras.main.width + 10 },
      ease: 'Quad.easeInOut',
      duration: animationLength
    });

    this.tweens.add({
      targets: ship,
      angle: { from: 0, to: 180 },
      ease: 'Sin.easeInOut',
      duration: 400,
      delay: (animationLength - 500) / 2
    });
  }

  public update(time: number, delta: number) {
    if (this.lastReference != this.nextReference) {
      this.gameState.timeStep(1, 1, this.nextReference - this.lastReference, this.nextRelative - this.lastRelative);
      this.lastReference = this.nextReference;
      this.lastRelative = this.nextRelative;
    }
  }

}
