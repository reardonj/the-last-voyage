import GameState, { Events, LocationChangedEvent, StatusMaxValue, TimePassedEvent } from "../GameData/GameState";
import { ObjectInfo } from "../GameData/SolarSystemObject";
import { Colours, Fonts, Resources, Sprites, UI } from "../Utilities";

const LeftMargin = 8;
const StatusBars = 20;

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
  infoActions: Phaser.GameObjects.BitmapText[];
  statusText: Phaser.GameObjects.BitmapText;

  public preload(): void {
    // Preload as needed.
  }

  public create(state: GameState): void {
    this.durationText = this.add.bitmapText(0, 696, Fonts.Proportional16, "").setTint(Colours.TextTint);
    this.locationText = this.add.bitmapText(0, 664, Fonts.Proportional24, "----").setTint(Colours.TextTint);
    this.statusText = this.add.bitmapText(0, 680, Fonts.Proportional16, "----").setTint(Colours.TextTint);
    this.rightAlign(this.statusText, LeftMargin);

    this.integrityText = this.updateSystemStatusText(LeftMargin / 2, Resources.Hud.Integrity);
    this.fuelText = this.updateSystemStatusText(LeftMargin / 2 + 20, Resources.Hud.Fuel);
    this.populationText = this.updateSystemStatusText(LeftMargin / 2 + 40, Resources.Hud.Passengers);
    this.suppliesText = this.updateSystemStatusText(LeftMargin / 2 + 60, Resources.Hud.Supplies);

    this.setupInfoPanel();

    state.eventSource.addListener(Events.TimePassed, this.updateTime, this);
    state.eventSource.addListener(Events.LocationChanged, this.updateLocation, this);
    state.eventSource.addListener(Events.FuelChanged, this.updateSystemStatus(this.fuelText), this);
    state.eventSource.addListener(Events.IntegrityChanged, this.updateSystemStatus(this.integrityText), this);
    state.eventSource.addListener(Events.ShowInfo, this.showInfo, this);
    state.eventSource.addListener(Events.UpdateStatus, this.updateStatus, this);
  }

  private setupInfoPanel() {
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
    this.infoActions = [];

    this.infoContainer = this.add.container(0, LeftMargin * 2);
    this.infoContainer.add(this.infoRect);
    this.infoContainer.add(this.infoTitle);
    this.infoContainer.add(this.infoContent);
    this.infoContainer.add(this.infoBorder);
    this.hideInfo();
  }

  updateSystemStatusText(y: number, name: string): StatusItem {
    const text = this.add.bitmapText(0, y, Fonts.Proportional16, name + " " + "|".repeat(StatusBars)).setTint(Colours.TextTint);
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
    this.locationText.setText([...state].reverse().join("."));
    this.rightAlign(this.locationText, LeftMargin);
  }

  updateStatus(state: string) {
    this.statusText.setText(state);
    this.rightAlign(this.statusText, LeftMargin);
  }

  updateSystemStatus(item: StatusItem): (state: number) => void {
    return (state: number) => {
      const bars = Phaser.Math.Clamp(StatusBars * state / StatusMaxValue, 0, StatusBars);
      const warning = bars / 20 < 0.2;

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
          this.clearInfoPanel();
          this.showInfo(info);
        },
        onCompleteScope: this
      })
    } else {
      this.infoTitle.setText(info.name);
      this.infoContent.setText(info.description);
      let yOffset = this.infoTitle.height + LeftMargin;

      this.infoContent.setY(yOffset);
      yOffset += this.infoContent.height + LeftMargin;

      for (const action of info.actions ?? []) {
        const control = this.add.bitmapText(LeftMargin, yOffset, Fonts.Proportional16, `[ ${action.name} ]`);
        UI.makeInteractive(control);
        this.infoContainer.add(control);
        this.infoActions.push(control);
        control.on('pointerdown', () => action.action(<GameState>this.scene.settings.data));
        yOffset += control.height + LeftMargin;
      }

      const width = [this.infoTitle.width, this.infoContent.width, ...this.infoActions.map(x => x.width)]
        .reduce((max, x) => Math.max(max, x), 0);
      const height = yOffset;
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
        this.clearInfoPanel();
      },
      onCompleteScope: this
    })
  }

  private clearInfoPanel() {
    this.infoContainer.setVisible(false);
    this.infoContainer.remove(this.infoActions);
    this.infoActions.forEach(x => x.destroy());
    this.infoActions = [];
  }
}
