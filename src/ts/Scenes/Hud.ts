import GameState, { Events, LocationChangedEvent, StatusMaxValue, TimePassedEvent } from "../GameData/GameState";
import Utilities, { Colours, Fonts, Resources } from "../Utilities";

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

type StatusItem = [name: string, display: Phaser.GameObjects.BitmapText, warning: Phaser.Tweens.Tween, running: boolean];

export default class Hud extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "HUD";

  private durationText: Phaser.GameObjects.BitmapText;
  private locationText: Phaser.GameObjects.BitmapText;
  private integrityText: StatusItem;
  private fuelText: StatusItem;
  private populationText: StatusItem;
  private suppliesText: StatusItem;

  public preload(): void {
    // Preload as needed.
  }

  public create(state: GameState): void {
    this.durationText = this.add.bitmapText(0, 696, Fonts.Proportional16, "").setTint(Colours.TextTint);
    this.locationText = this.add.bitmapText(0, 680, Fonts.Proportional24, "----").setTint(Colours.TextTint);

    this.integrityText = this.setupStatusText(LeftMargin / 2, Resources.Hud.Integrity);
    this.fuelText = this.setupStatusText(LeftMargin / 2 + 20, Resources.Hud.Fuel);
    this.populationText = this.setupStatusText(LeftMargin / 2 + 40, Resources.Hud.Passengers);
    this.suppliesText = this.setupStatusText(LeftMargin / 2 + 60, Resources.Hud.Supplies);

    state.eventSource.addListener(Events.TimePassed, this.updateTime, this);
    state.eventSource.addListener(Events.LocationChanged, this.updateLocation, this);
    state.eventSource.addListener(Events.FuelChanged, this.updateStatusText(this.fuelText), this);
  }

  setupStatusText(y: number, name: string): StatusItem {
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

    return [name, text, tween, false];
  }

  rightAlign(text: Phaser.GameObjects.BitmapText, margin: number) {
    text.setX(this.cameras.main.width - text.width - margin);
  }

  public update() {
  }

  updateTime(state: TimePassedEvent) {
    this.durationText.setText(
      `${Resources.Hud.MissionDuration}: ` +
      `${createTimeString(state.earth, state.minutesPerTick)} ${Resources.Hud.AbsoluteDuration} / ` +
      `${createTimeString(state.relative, state.minutesPerTick)} ${Resources.Hud.RelativeDuration}`);
    this.rightAlign(this.durationText, LeftMargin);
  }

  updateLocation(state: LocationChangedEvent) {
    this.locationText.setText(state.reverse().join("."));
    this.rightAlign(this.locationText, LeftMargin);
  }

  updateStatusText(item: StatusItem): (state: number) => void {
    return (state: number) => {
      const bars = Phaser.Math.Clamp(5 * state / StatusMaxValue, 0, 5);
      const warning = bars < 0.5;

      item[1].setText(item[0] + " " + "|".repeat(Math.ceil(bars)));
      if (warning && !item[3]) {
        item[2].resume();
        item[3] = true;
      } else if (!warning && item[3]) {
        item[2].pause();
        item[1].setAlpha(1);
        item[3] = false;
      }
    };
  }
}
