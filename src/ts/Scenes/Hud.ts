import GameState, { Events, LocationChangedEvent, TimePassedEvent } from "../GameData/GameState";
import { Colours, Fonts } from "../Utilities";

const LeftMargin = 8;

function createTimeString(time: number, minutesPerTick: number): string {
  const years = Math.floor(time / 524160);
  time = time % 524160;
  const weeks = 1 + Math.floor(time / 10080);
  time = time % 10080;
  const days = 1 + Math.floor(time / 1440);
  time = time % 1440;
  const hours = pad(time / 60, 2);
  const minutes = time % 60;

  if (minutesPerTick < 1) {
    return `${pad(years, 4)}-${pad(weeks, 2)}-${days.toFixed(0)} ${hours}:${pad(minutes, 2)}`;
  } else {
    return `${pad(years, 4)}-${pad(weeks, 2)}-${days.toFixed(0)}`;
  }
}

function pad(num: number, length: number) {
  return Math.floor(num).toFixed(0).padStart(length, "0");
}

export default class Hud extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "HUD";

  private durationText: Phaser.GameObjects.BitmapText;
  private locationText: Phaser.GameObjects.BitmapText;
  private integrityText: Phaser.GameObjects.BitmapText;
  private fuelText: Phaser.GameObjects.BitmapText;
  private populationText: Phaser.GameObjects.BitmapText;
  private suppliesText: Phaser.GameObjects.BitmapText;

  integrityWarning: Phaser.Tweens.Tween;
  suppliesWarning: Phaser.Tweens.Tween;
  populationWarning: Phaser.Tweens.Tween;
  fuelWarning: Phaser.Tweens.Tween;

  public preload(): void {
    // Preload as needed.
  }

  public create(state: GameState): void {
    this.durationText = this.add.bitmapText(0, 696, Fonts.Proportional16, "").setTint(Colours.TextTint);
    this.locationText = this.add.bitmapText(0, 680, Fonts.Proportional24, "----").setTint(Colours.TextTint);

    [this.integrityText, this.integrityWarning] = this.setupStatusText(LeftMargin / 2, "Integrity");
    [this.fuelText, this.fuelWarning] = this.setupStatusText(LeftMargin / 2 + 20, "Fuel");
    [this.populationText, this.populationWarning] = this.setupStatusText(LeftMargin / 2 + 40, "Population");
    [this.suppliesText, this.suppliesWarning] = this.setupStatusText(LeftMargin / 2 + 60, "Supplies");

    state.eventSource.addListener(Events.TimePassed, this.updateTime, this);
    state.eventSource.addListener(Events.LocationChanged, this.updateLocation, this);
  }

  setupStatusText(y: number, name: string): [Phaser.GameObjects.BitmapText, Phaser.Tweens.Tween] {
    const text = this.add.bitmapText(0, y, Fonts.Proportional16, name + " |||||").setTint(Colours.TextTint);
    this.rightAlign(text, LeftMargin);

    const tween = this.add.tween({
      targets: text,
      alpha: { from: 1, to: 0.2 },
      ease: 'Linear',
      duration: 1000,
      repeat: -1,
      yoyo: true,
      paused: true
    });

    return [text, tween];
  }

  rightAlign(text: Phaser.GameObjects.BitmapText, margin: number) {
    text.setX(this.cameras.main.width - text.width - margin);
  }

  public update() {
  }

  updateTime(state: TimePassedEvent) {
    this.durationText.setText(
      `Mission Duration: ${createTimeString(state.earth, state.minutesPerTick)} Earth / ${createTimeString(state.relative, state.minutesPerTick)} Relative`);
    this.rightAlign(this.durationText, LeftMargin);
  }

  updateLocation(state: LocationChangedEvent) {
    this.locationText.setText(state.reverse().join("."));
    this.rightAlign(this.locationText, LeftMargin);
  }
}
