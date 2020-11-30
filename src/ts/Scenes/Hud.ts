/* 
Copyright 2020, Justin Reardon. 

This file is part of The Last Voyage.

The Last Voyage is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

The Last Voyage is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with The Last Voyage.  If not, see <https://www.gnu.org/licenses/>.
*/

import { AudioManager } from "../GameData/AudioManager";
import GameState, { Alert, Events, LocationChangedEvent, ObjectInfo, ShipSystem, ShipSystems, StatusMaxValue, TimePassedEvent } from "../GameData/GameState";
import { Colours, Fonts, Resources, Sprites, UI } from "../Utilities";

const StatusBars = 20;

type StatusItem = [name: string, display: Phaser.GameObjects.BitmapText, running: boolean];

export default class Hud extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "HUD";

  private durationText: Phaser.GameObjects.BitmapText;
  private locationText: Phaser.GameObjects.BitmapText;
  private integrityText: StatusItem;
  private fuelText: StatusItem;
  private passengersText: StatusItem;
  private suppliesText: StatusItem;
  infoContainer: Phaser.GameObjects.Container;
  infoTitle: Phaser.GameObjects.BitmapText;
  infoRect: Phaser.GameObjects.Rectangle;
  infoBorder: Phaser.GameObjects.Image;
  infoDetails: Phaser.GameObjects.BitmapText[];
  statusText: Phaser.GameObjects.BitmapText;
  hoverHint: Phaser.GameObjects.BitmapText;
  pendingWarnings: Set<string> = new Set();
  warnings: { end: number, text: string, display: Phaser.GameObjects.BitmapText }[] = [];
  systems: [ShipSystem, Phaser.GameObjects.BitmapText][];
  currentInfo: ObjectInfo | null;
  currentAlert: Alert | null;
  alertRect: Phaser.GameObjects.Rectangle;
  alertTitle: Phaser.GameObjects.BitmapText;
  alertText: Phaser.GameObjects.BitmapText;
  alertAction: Phaser.GameObjects.BitmapText;
  alertContainer: Phaser.GameObjects.Container;
  needsAttentionAnimation: Phaser.Tweens.Tween;
  needsAttentionAlpha: number = 1;
  permanentDamage: Phaser.GameObjects.BitmapText;

  public preload(): void {
    // Preload as needed.
  }

  public create(state: GameState): void {
    this.durationText = this.add.bitmapText(0, 696, Fonts.Proportional16, "").setTint(Colours.TextTint);
    this.locationText = this.add.bitmapText(0, 664, Fonts.Proportional24, "----").setTint(Colours.TextTint);
    this.statusText = this.add.bitmapText(0, 680, Fonts.Proportional16, "----").setTint(Colours.TextTint);
    this.rightAlign(this.statusText, UI.Margin);

    this.needsAttentionAnimation = this.add.tween({
      targets: this,
      needsAttentionAlpha: { from: 1, to: 0.2 },
      ease: 'Linear',
      duration: 1000,
      repeat: -1,
      yoyo: true
    });

    this.integrityText = this.createSystemStatusText(UI.Margin / 2, Resources.Hud.Integrity, () => this.integrityHint());
    this.fuelText = this.createSystemStatusText(UI.Margin / 2 + 20, Resources.Hud.Fuel, () => this.fuelHint());
    this.suppliesText = this.createSystemStatusText(UI.Margin / 2 + 40, Resources.Hud.Supplies, () => this.suppliesHint());
    this.passengersText = this.createSystemStatusText(UI.Margin / 2 + 60, Resources.Hud.Passengers, () => this.passengersHint());

    this.permanentDamage = this.add
      .bitmapText(this.cameras.main.width - UI.Margin, UI.Margin / 2, Fonts.Proportional16, "")
      .setOrigin(1, 0)
      .setTint(Colours.WarningTint);

    this.hoverHint = this.add
      .bitmapText(0, UI.Margin / 2, Fonts.Proportional16, "", undefined, Phaser.GameObjects.BitmapText.ALIGN_CENTER)
      .setMaxWidth(800)
      .setTint(Colours.TextTint);

    this.setupShipSystems(state);
    this.setupInfoPanel();
    this.setupAlertPanel(state);

    this.updateSystemStatus(this.fuelText)(state.fuel);
    this.updateSystemStatus(this.integrityText)(state.integrity);
    this.updateSystemStatus(this.passengersText)(state.passengers);
    this.updateSystemStatus(this.suppliesText)(state.supplies);

    state.watch(Events.TimePassed, this.updateTime, this);
    state.watch(Events.LocationChanged, this.updateLocation, this);
    state.watch(Events.FuelChanged, this.updateSystemStatus(this.fuelText), this);
    state.watch(Events.IntegrityChanged, this.updateIntegrityStatus(this.integrityText), this);
    state.watch(Events.PassengersChanged, this.updateSystemStatus(this.passengersText), this);
    state.watch(Events.SuppliesChanged, this.updateSystemStatus(this.suppliesText), this);
    state.watch(Events.Warning, this.handleWarning, this);
    state.watch(Events.ShowInfo, this.showInfo, this);
    state.watch(Events.HoverHint, this.showHoverHint, this);
    state.watch(Events.UpdateStatus, this.updateStatus, this);
    state.watch(Events.Alert, this.showAlert, this);
  }

  setupShipSystems(state: GameState) {
    let yOffset = this.passengersText[1].y + this.passengersText[1].height + UI.Margin;
    this.systems = [];
    for (const system of state.shipSystemObjects) {
      const label = this.add.bitmapText(0, yOffset, Fonts.Proportional16, `[ ${system.name} ]`);
      UI.makeInteractive(label);
      UI.showHoverHint(label, state, () => system.hint())
      label.on("pointerdown", () => this.gameState().emit(Events.ShowInfo, system.info()));
      this.rightAlign(label, UI.Margin);


      this.systems.push([system, label]);
      yOffset += label.height + UI.Margin / 2
    }
  }

  suppliesHint(): string {
    const suppliesPercent = Math.round(100 * this.gameState().supplies / StatusMaxValue).toFixed(0);
    return `Supplies: ${suppliesPercent}% cargo capacity\nAvailable components and raw materials for fabrication and ship maintenance.\nHull integrity will quickly degrade if no supplies for maintenance are available.`;
  }

  passengersHint(): string {
    const passengers = Math.floor(this.gameState().passengers).toLocaleString();
    return `${passengers} live human passengers, in cryostasis`
  }

  fuelHint(): string {
    const fuelPercent = Math.round(100 * this.gameState().fuel / StatusMaxValue).toFixed(0);
    return `Fuel: ${fuelPercent}%\n Reactor fuel available to power the ship. Orbit within 200 million km of a sun to recharge fuel cells.`;
  }

  integrityHint(): string {
    const integrityPercent = Math.round(100 * this.gameState().integrity / StatusMaxValue).toFixed(0);
    return `Hull integrity: ${integrityPercent}%\n Irreparable damage: ${(this.gameState().permanentDamage / StatusMaxValue * 100).toFixed()}% total integrity\nShip system stability. Estimated endurance without repair: 50 years (relative)`;
  }

  private setupInfoPanel() {
    this.infoRect = this.add.rectangle(0, 0, 4, 4, Colours.PanelBackground, 0.8).setOrigin(0, 0);
    this.infoBorder = this.add.image(0, 0, Sprites.ShortGradient)
      .setOrigin(0, 0)
      .setTint(Colours.TextTint)
      .setFlipX(true);
    this.infoTitle = this.add.bitmapText(UI.Margin, UI.Margin, Fonts.Proportional24, "")
      .setTint(Colours.TextTint);
    this.infoDetails = [];

    this.infoContainer = this.add.container(0, UI.Margin * 4);
    this.infoContainer.add(this.infoRect);
    this.infoContainer.add(this.infoTitle);
    this.infoContainer.add(this.infoBorder);
    this.hideInfo();
  }

  private setupAlertPanel(gameState: GameState) {
    this.alertRect = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, Colours.PanelBackground, 0.8)
      .setOrigin(0, 0)
      .setInteractive();

    this.alertTitle = this.add.bitmapText(UI.Margin, UI.Margin, Fonts.Proportional24, "", 32)
      .setTint(Colours.TextTint);
    this.alertText = this.add.bitmapText(0, 0, Fonts.Proportional24, "", undefined, Phaser.GameObjects.BitmapText.ALIGN_CENTER)
      .setMaxWidth(600)
      .setTint(Colours.TextTint);

    this.alertAction = this.add.bitmapText(0, 0, Fonts.Proportional24, "");
    UI.makeInteractive(this.alertAction);
    UI.showHoverHint(this.alertAction, gameState, () => this.currentAlert?.action.hint ?? "");
    this.alertAction.on('pointerdown', () => this.currentAlert?.action.action(gameState));

    this.alertContainer = this.add.container(0, this.alertRect.height);
    this.alertContainer.add(this.alertRect);
    this.alertContainer.add(this.alertTitle);
    this.alertContainer.add(this.alertText);
    this.alertContainer.add(this.alertAction);
    this.hideAlert();
  }

  createSystemStatusText(y: number, name: string, hint: () => string): StatusItem {
    const text = this.add.bitmapText(0, y, Fonts.Proportional16, name + " " + "|".repeat(StatusBars)).setTint(Colours.TextTint);
    this.rightAlign(text, UI.Margin);
    UI.showHoverHint(text, this.gameState(), hint);

    return [name, text, false];
  }

  createWarningText(message: string) {
    const text = this.add.bitmapText(0, 0, Fonts.Proportional16, message, undefined, Phaser.GameObjects.BitmapText.ALIGN_RIGHT)
      .setTint(Colours.WarningTint)
      .setMaxWidth(400)
      .setAlpha(1);
    this.rightAlign(text, UI.Margin);
    return text;
  }

  rightAlign(text: Phaser.GameObjects.BitmapText, margin: number) {
    text.setX(this.cameras.main.width - text.width - margin);
  }

  public update(time: number, delta: number) {
    // Update active animations for ship systems
    for (const [sys, label] of this.systems) {
      if (sys.needsAttention) {
        label.alpha = this.needsAttentionAlpha;
      } else {
        label.setAlpha(1);
      }
    }

    // Update active animations for status bars
    for (const status of [this.integrityText, this.fuelText, this.suppliesText, this.passengersText]) {
      status[1].alpha = status[2] ? this.needsAttentionAlpha : 1;
    }

    // Update warnings
    AudioManager()?.warning(this.pendingWarnings.size > 0)
    if (this.pendingWarnings.size > 0) {
      const newEndTime = time + 5000;
      for (const warning of this.pendingWarnings) {
        const existingWarning = this.warnings.find(x => x.text === warning);
        if (existingWarning) {
          existingWarning.end = Math.max(existingWarning.end, time + 2000);
        } else {
          this.warnings.push({ end: newEndTime, text: warning, display: this.createWarningText(warning) })
        }
      }
      this.pendingWarnings.clear();
    }

    // Remove expired warnings
    const newWarningList = [];
    // Start below the systems list
    const lastSystemButton = this.systems[this.systems.length - 1][1]
    let yOffset = lastSystemButton.y + lastSystemButton.height + UI.Margin;
    for (const warning of this.warnings) {
      if (warning.end < time) {
        warning.display.destroy();
      } else {
        warning.display.setY(yOffset);
        yOffset = warning.display.y + warning.display.height + UI.Margin;
        newWarningList.push(warning);
      }
    }
    this.warnings = newWarningList;
  }

  updateTime(state: TimePassedEvent) {
    this.durationText.setText(
      `${Resources.Hud.MissionDuration}: ` +
      `${UI.createTimeString(state.earth, state.minutesPerTick, 1)} ${Resources.Hud.AbsoluteDuration} / ` +
      `${UI.createTimeString(state.relative, state.minutesPerTick, 0)} ${Resources.Hud.RelativeDuration}`);
    this.rightAlign(this.durationText, UI.Margin);
  }

  updateLocation(state: LocationChangedEvent) {
    this.locationText.setText([...state].reverse().join("."));
    this.rightAlign(this.locationText, UI.Margin);
  }

  updateStatus(state: string) {
    this.statusText.setText(state);
    this.rightAlign(this.statusText, UI.Margin);
  }

  private updateSystemStatus(item: StatusItem): (state: number) => void {
    return (state: number) => {
      const bars = Phaser.Math.Clamp(StatusBars * state / StatusMaxValue, 0, StatusBars);
      item[1].setText(item[0] + " " + "|".repeat(Math.round(bars)));
      item[2] = bars / 20 < 0.2;
    };
  }

  private updateIntegrityStatus(item: StatusItem): (state: number) => void {
    return (state: number) => {
      this.updateSystemStatus(item)(state);
      const bars = Phaser.Math.Clamp(StatusBars * this.gameState().permanentDamage / StatusMaxValue, 0, StatusBars);
      this.permanentDamage.setText("|".repeat(Math.round(bars)));
    };
  }

  private handleWarning(warning: string): void {
    this.pendingWarnings.add(warning);
  }

  showAlert(alert: Alert | null) {
    if (!alert) {
      this.hideAlert();
    } else if (!this.currentAlert) {
      this.showHoverHint(null);
      this.currentAlert = alert;
      this.alertTitle.setText(alert.title).setY(0);
      UI.centre(0, this.alertRect.width, this.alertTitle);
      let yOffset = this.alertTitle.height + UI.Margin * 2;

      this.alertText.setText(alert.text).setY(yOffset);
      UI.centre(0, this.alertRect.width, this.alertText);
      yOffset += this.alertText.height + UI.Margin * 2;

      this.alertAction.setText(`[ ${alert.action.name}]`).setY(yOffset);
      UI.centre(0, this.alertRect.width, this.alertAction);
      yOffset += this.alertAction.height;

      yOffset = (this.alertRect.height - yOffset) / 2;
      this.alertTitle.y += yOffset;
      this.alertText.y += yOffset;
      this.alertAction.y += yOffset;

      this.alertContainer.setY(this.alertRect.height);
      this.alertContainer.setVisible(true);

      this.tweens.add({
        targets: this.alertContainer,
        y: 0,
        ease: 'cubic.inout',
        duration: 500,
        repeat: 0,
      })
    }
  }

  hideAlert() {
    this.currentAlert = null;
    this.tweens.add({
      targets: this.alertContainer,
      y: this.cameras.main.height,
      ease: 'cubic.inout',
      duration: 500,
      repeat: 0,
      onComplete: () => {
        this.currentAlert = null;
      },
      onCompleteScope: this
    })
  }

  showInfo(info: ObjectInfo | null) {
    if (!info) {
      this.hideInfo();
    } else if (info.onlyUpdate && this.currentInfo && info.name !== this.currentInfo.name) {
      // If the info is an update request, ignore unless showing the same info or nothing.
      return;
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
      this.showHoverHint(null);
      this.currentInfo = info;
      this.currentInfo.onlyUpdate = false;
      this.infoTitle.setText(info.name);
      let yOffset = this.infoTitle.height + UI.Margin;

      const gameState = <GameState>this.scene.settings.data;
      for (const line of info.details ?? []) {
        let control: Phaser.GameObjects.BitmapText;
        if (typeof (line) === "string") {
          control = this.add.bitmapText(UI.Margin, yOffset, Fonts.Proportional16, line)
            .setTint(Colours.TextTint)
            .setMaxWidth(400);
        } else if (Array.isArray(line)) {
          control = this.add.bitmapText(UI.Margin, yOffset, Fonts.Proportional16, line[0])
            .setTint(Colours.TextTint)
            .setMaxWidth(400);
          UI.showHoverHint(control, gameState, line[1])
        } else {
          control = this.add.bitmapText(UI.Margin, yOffset, Fonts.Proportional16, `[ ${line.name} ]`);
          UI.makeInteractive(control);
          UI.showHoverHint(control, gameState, () => line.hint);
          control.on('pointerdown', () => line.action(gameState));
        }
        yOffset += control.height + UI.Margin / 2;
        this.infoContainer.add(control);
        this.infoDetails.push(control);
      }

      const width = [this.infoTitle.width, ...this.infoDetails.map(x => x.width)]
        .reduce((max, x) => Math.max(max, x), 0);
      const height = yOffset;
      this.infoRect.setSize(width + UI.Margin * 2, height + UI.Margin * 2);
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
    this.currentInfo = null;
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
    this.infoContainer.remove(this.infoDetails);
    this.infoDetails.forEach(x => x.destroy());
    this.infoDetails = [];
  }

  private showHoverHint(hint: string | null) {
    this.hoverHint.setText(hint ?? "");
    UI.centre(0, this.cameras.main.width, this.hoverHint);
  }

  private gameState() {
    return (<GameState>this.scene.settings.data);
  }
}
