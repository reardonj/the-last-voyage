import GameState, { Events, LocationChangedEvent, ShipSystem, ShipSystems, StatusMaxValue, TimePassedEvent } from "../GameData/GameState";
import { ObjectInfo } from "../GameData/NavigationObjects";
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

type WarningItem = { text: Phaser.GameObjects.BitmapText; anim: Phaser.Tweens.Tween | null; };

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
  hoverHint: Phaser.GameObjects.BitmapText;
  warningText: WarningItem;
  pendingWarnings = new Set<string>();
  systems: [ShipSystem, Phaser.GameObjects.BitmapText, Phaser.Tweens.Tween][];

  public preload(): void {
    // Preload as needed.
  }

  public create(state: GameState): void {
    this.durationText = this.add.bitmapText(0, 696, Fonts.Proportional16, "").setTint(Colours.TextTint);
    this.locationText = this.add.bitmapText(0, 664, Fonts.Proportional24, "----").setTint(Colours.TextTint);
    this.statusText = this.add.bitmapText(0, 680, Fonts.Proportional16, "----").setTint(Colours.TextTint);
    this.rightAlign(this.statusText, LeftMargin);

    this.integrityText = this.createSystemStatusText(LeftMargin / 2, Resources.Hud.Integrity, () => this.integrityHint());
    this.fuelText = this.createSystemStatusText(LeftMargin / 2 + 20, Resources.Hud.Fuel, () => this.fuelHint());
    this.suppliesText = this.createSystemStatusText(LeftMargin / 2 + 40, Resources.Hud.Supplies, () => this.suppliesHint());
    this.populationText = this.createSystemStatusText(LeftMargin / 2 + 60, Resources.Hud.Passengers, () => this.passengersHint());
    this.warningText = this.createWarningText();

    this.hoverHint = this.add
      .bitmapText(0, LeftMargin / 2, Fonts.Proportional16, "", undefined, Phaser.GameObjects.BitmapText.ALIGN_CENTER)
      .setTint(Colours.TextTint);

    this.setupInfoPanel();
    this.setupShipSystems(state);

    state.watch(Events.TimePassed, this.updateTime, this);
    state.watch(Events.LocationChanged, this.updateLocation, this);
    state.watch(Events.FuelChanged, this.updateSystemStatus(this.fuelText), this);
    state.watch(Events.IntegrityChanged, this.updateSystemStatus(this.integrityText), this);
    state.watch(Events.PassengersChanged, this.updateSystemStatus(this.populationText), this);
    state.watch(Events.Warning, this.updateWarning(this.warningText), this);
    state.watch(Events.ShowInfo, this.showInfo, this);
    state.watch(Events.HoverHint, this.showHoverHint, this);
    state.watch(Events.UpdateStatus, this.updateStatus, this);
  }

  setupShipSystems(state: GameState) {
    let yOffset = this.populationText[1].y + this.populationText[1].height + LeftMargin;
    this.systems = [];
    for (const system of state.shipSystemObjects) {
      const label = this.add.bitmapText(0, yOffset, Fonts.Proportional16, `[ ${system.name} ]`);
      UI.makeInteractive(label);
      UI.showHoverHint(label, state, () => system.hint())
      label.on("pointerdown", () => this.gameState().emit(Events.ShowInfo, system.info()));
      this.rightAlign(label, LeftMargin);

      const activeAnimation = this.add.tween({
        targets: label,
        alpha: { from: 1, to: 0.2 },
        ease: 'Linear',
        duration: 1000,
        repeat: -1,
        yoyo: true,
        paused: true
      });

      this.systems.push([system, label, activeAnimation]);
    }
  }

  suppliesHint(): string {
    const suppliesPercent = Math.max(1, 100 * this.gameState().fuel / StatusMaxValue).toFixed(0);
    return `Supplies: ${suppliesPercent}% cargo capacity\nAvaiable components and raw materials for fabrication`;
  }

  passengersHint(): string {
    const passengers = Math.ceil(this.gameState().passengers).toLocaleString();
    return `${passengers} live human passengers, in cryostasis`
  }

  fuelHint(): string {
    const fuelPercent = Math.max(1, 100 * this.gameState().fuel / StatusMaxValue).toFixed(0);
    return `Fuel: ${fuelPercent}%\n Reactor fuel available to power the ship`;
  }

  integrityHint(): string {
    const integrityPercent = Math.max(1, 100 * this.gameState().integrity / StatusMaxValue).toFixed(0);
    return `Hull integrity: ${integrityPercent}%\nLoss will result in injuries, deaths and ultimately the destruction of the ship`;
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

  createSystemStatusText(y: number, name: string, hint: () => string): StatusItem {
    const text = this.add.bitmapText(0, y, Fonts.Proportional16, name + " " + "|".repeat(StatusBars)).setTint(Colours.TextTint);
    this.rightAlign(text, LeftMargin);
    UI.showHoverHint(text, this.gameState(), hint);
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

  createWarningText(): WarningItem {
    const text = this.add.bitmapText(0, 600, Fonts.Proportional16, "", undefined, Phaser.GameObjects.BitmapText.ALIGN_CENTER)
      .setTint(Colours.WarningTint)
      .setAlpha(0);

    return { text, anim: null };
  }

  rightAlign(text: Phaser.GameObjects.BitmapText, margin: number) {
    text.setX(this.cameras.main.width - text.width - margin);
  }

  public update() {
    // Update active animations for ship systems
    for (const [sys, label, anim] of this.systems) {
      if (sys.needsAttention && !anim.isPlaying()) {
        anim.resume();
      } else if (!sys.needsAttention && anim.isPlaying()) {
        anim.pause();
        label.setAlpha(1);
      }
    }

    // Update warnings
    if (this.pendingWarnings.size > 0) {
      const warningList: string[] = [];
      for (const warning of this.pendingWarnings) {
        warningList.push(warning);
      }
      this.pendingWarnings.clear();
      const warnings = warningList.join("\n");
      this.warningText.text.setText(warnings);
      UI.centre(0, this.cameras.main.width, this.warningText.text);
      this.warningText.anim?.stop();
      this.warningText.anim = this.add.tween({
        targets: this.warningText.text,
        alpha: { start: 1, to: 0 },
        ease: 'Sin',
        duration: 2000,
        repeat: 0,
        delay: 3500
      });
    }
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

  private updateSystemStatus(item: StatusItem): (state: number) => void {
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

  private updateWarning(item: WarningItem): (warning: string) => void {
    return (warning: string) => {
      this.pendingWarnings.add(warning);
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

      const gameState = <GameState>this.scene.settings.data;
      for (const action of info.actions ?? []) {
        const control = this.add.bitmapText(LeftMargin, yOffset, Fonts.Proportional16, `[ ${action.name} ]`);
        UI.makeInteractive(control);
        UI.showHoverHint(control, gameState, () => action.hint);

        this.infoContainer.add(control);
        this.infoActions.push(control);
        control.on('pointerdown', () => action.action(gameState));
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

  private showHoverHint(hint: string | null) {
    this.hoverHint.setText(hint ?? "");
    UI.centre(0, this.cameras.main.width, this.hoverHint);
  }

  private gameState() {
    return (<GameState>this.scene.settings.data);
  }
}
