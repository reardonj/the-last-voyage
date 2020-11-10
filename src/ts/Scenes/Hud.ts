import GameState, { Events, LocationChangedEvent, StatusMaxValue, TimePassedEvent } from "../GameData/GameState";
import { ObjectInfo } from "../GameData/SolarSystemObject";
import { Colours, Fonts, Resources, Sprites } from "../Utilities";

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
  infoContainer: Phaser.GameObjects.Container;
  infoTitle: Phaser.GameObjects.BitmapText;
  infoRect: Phaser.GameObjects.Rectangle;
  infoBorder: Phaser.GameObjects.Image;
  infoContent: Phaser.GameObjects.BitmapText;

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

    this.infoRect = this.add.rectangle(0, 0, 4, 4, Colours.PanelBackground, 0.8).setOrigin(0, 0);
    this.infoBorder = this.add.image(0, 0, Sprites.ShortGradient)
      .setOrigin(0, 0)
      .setTint(Colours.TextTint)
      .setFlipX(true);
    this.infoTitle = this.add.bitmapText(LeftMargin, LeftMargin, Fonts.Proportional24, "")
      .setTint(Colours.TextTint);
    this.infoContent = this.add.bitmapText(LeftMargin, 0, Fonts.Proportional16, "")
      .setTint(Colours.TextTint)
      .setMaxWidth(400);

    this.infoContainer = this.add.container(0, LeftMargin * 2);
    this.infoContainer.add(this.infoRect);
    this.infoContainer.add(this.infoTitle);
    this.infoContainer.add(this.infoContent);
    this.infoContainer.add(this.infoBorder);
    this.hideInfo();

    state.eventSource.addListener(Events.TimePassed, this.updateTime, this);
    state.eventSource.addListener(Events.LocationChanged, this.updateLocation, this);
    state.eventSource.addListener(Events.FuelChanged, this.updateStatusText(this.fuelText), this);
    state.eventSource.addListener(Events.ShowInfo, this.showInfo, this);
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

  showInfo(info: ObjectInfo | null) {
    if (!info) {
      this.hideInfo();
    } else if (this.infoContainer.visible) {
      this.tweens.add({
        targets: this.infoContainer,
        x: -this.infoRect.width,
        ease: 'cubic.inout',
        duration: 200,
        repeat: 0,
        onComplete: () => {
          this.infoContainer.setVisible(false);
          this.showInfo(info);
        },
        onCompleteScope: this
      })
    } else {
      this.infoTitle.setText(info.name);
      this.infoContent.setText(info.description);
      this.infoContent.setY(this.infoTitle.height + LeftMargin);

      const width = Math.max(this.infoTitle.width, this.infoContent.width);
      const height = this.infoTitle.height + this.infoContent.height + LeftMargin;
      this.infoRect.setSize(width + LeftMargin * 2, height + LeftMargin * 2);
      this.infoBorder.displayHeight = this.infoRect.height;
      this.infoBorder.setX(this.infoRect.width - 8);
      this.infoContainer.setX(-this.infoRect.width);
      this.infoContainer.setVisible(true);

      this.tweens.add({
        targets: this.infoContainer,
        x: { from: -this.infoRect.width, to: 0 },
        ease: 'cubic.inout',
        duration: 200,
        repeat: 0,
      })

    }
  }

  hideInfo() {
    this.tweens.add({
      targets: this.infoContainer,
      x: -this.infoRect.width,
      ease: 'cubic.inout',
      duration: 200,
      repeat: 0,
      onComplete: () => {
        this.infoContainer.setVisible(false);
      },
      onCompleteScope: this
    })
  }
}
