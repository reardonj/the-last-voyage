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
    const sameSystem = this.sceneState.destination.name === this.sceneState.origin.name;
    const titleText = `${sameSystem ? 'Returning' : 'Travelling'} to ${this.sceneState.destination.name}`;

    this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height, 0x000000, 1);
    const title = this.add.bitmapText(0, 200, Fonts.Proportional24, titleText, 32)
      .setTint(Colours.TextTint)
    UI.centre(0, this.cameras.main.width, title);
    const ship = this.add.image(-50, this.cameras.main.height / 2, Sprites.Ship);

    state.emit(Events.UpdateStatus, "Acceleration: 1.00 g");
    state.emit(Events.LocationChanged, ["Interstellar Space"]);

    let reference = this.sceneState.travelTime.reference * 365 * 24 * 60;
    let relative = this.sceneState.travelTime.relative * 365 * 24 * 60;

    const farthestOrbit = this.sceneState.destination.farthestOrbit();

    let initPosition = this.sceneState.destination
      .vectorTo(this.sceneState.origin)
      .normalize();
    // If reentering the same system, use the departure position.
    if (this.sceneState.destination.name == this.sceneState.origin.name) {
      initPosition = this.sceneState.leavingPosition.clone().normalize()
    }

    const nextState = {
      velocity: initPosition.clone().scale(-5).rotate(0.001),
      position: initPosition.scale(farthestOrbit + 500),
      orientation: initPosition.angle(),
      name: this.sceneState.destination.name
    }
    const animationLength = Math.max(4000, this.sceneState.travelTime.reference * 500);

    this.tweens.add({
      targets: this,
      nextReference: { from: 0, to: reference },
      from: 0,
      to: reference,
      ease: 'Linear',
      duration: animationLength
    })

    this.tweens.add({
      targets: this,
      nextRelative: { from: 0, to: relative },
      from: 0,
      to: relative,
      ease: 'Quad.easeInOut',
      duration: animationLength,
      onComplete: () => {
        // Going back doesn't trigger an update??
        if (this.lastReference == 0) {
          this.gameState.timeStep(1, 1, reference, relative);
        }
        this.gameState.ship.orientation = nextState.orientation;
        this.gameState.ship.position = [nextState.position.x, nextState.position.y];
        this.gameState.ship.velocity = [nextState.velocity.x, nextState.velocity.y];

        this.gameState.transitionTo(["solar-system", { name: nextState.name }]);
        this.game.events.once("step", () => {
          this.gameState.doStateBasedTransitions(this);
          state.emit(Events.EnteredSystem, nextState.name);
        }, this);
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
