import { Scene } from "phaser";
import Utilities from "../Utilities";

export interface Audio {
  init(): void
  play(effect: SoundEffect): void
  warning(on: boolean): void
  changeBackground(background: Background): void
}

export function audioAssets(): [Sound, string][] {
  return [
    ["click", "audio/click.ogg"],
    ["rollover", "audio/rollover.ogg"],
    ["opening", "audio/bittersweet.ogg"],
    ["game", "audio/Drifting Beyond the Stars.ogg"],
    ["victory", "audio/triumphant.ogg"],
    ["loss", "audio/hauntingPiano.ogg"],
    ["warning", "audio/warning.ogg"]
  ]
}

let scene: AudioScene | undefined;

export function AudioManager(): Audio | undefined {
  return scene;
}

export class AudioScene extends Scene implements Audio {
  static Name = "Audio";

  private currentBackground?: Background;
  private sounds: { [id: string]: Phaser.Sound.BaseSound } = {};
  private lastWarning: number = 0;
  private warningOn: boolean = false;

  public create() {
    scene = this;
  }

  public init() {
    this.sounds["click"] = this.sound.add("click", { volume: maxVolume("click") });
    this.sounds["rollover"] = this.sound.add("rollover", { volume: maxVolume("rollover") });
    this.sounds["opening"] = this.sound.add("opening", { loop: true });
    this.sounds["game"] = this.sound.add("game", { loop: true });
    this.sounds["victory"] = this.sound.add("victory", { loop: false });
    this.sounds["loss"] = this.sound.add("loss", { loop: false });
    this.sounds["warning"] = this.sound.add("warning", { volume: maxVolume("warning"), loop: false });
  }

  public update(time: number, delta: number) {
    if (this.warningOn && this.lastWarning + 2000 < time) {
      this.sounds["warning"].play();
      this.lastWarning = time;
    }
  }

  public warning(on: boolean) {
    this.warningOn = on;
    if (!on) {
      this.lastWarning = 0;
    }
  }

  public play(effect: SoundEffect) {
    this.sounds[effect].play();
  }

  public changeBackground(next: Background) {
    const curr = this.currentBackground;
    if (next === curr) {
      return;
    }

    if (curr) {
      this.tweens.add({
        targets: this.sounds[curr],
        volume: 0.0001,
        ease: "Expo.easeOut",
        duration: 5000,
        onComplete: () => this.sounds[curr].stop()
      })
    }

    this.tweens.add({
      targets: this.sounds[next],
      volume: { from: 0.0001, to: maxVolume(next) },
      ease: "Expo.easeIn",
      duration: 4000,
      repeat: 0
    })
    this.sounds[next].play();
    this.currentBackground = next;
  }
}

function maxVolume(sound: Sound): number {
  switch (sound) {
    case "click":
      return 1;
    case "game":
      return 0.1;
    case "loss":
      return 0.2;
    case "opening":
      return 0.1;
    case "rollover":
      return 1;
    case "victory":
      return 0.2;
    case "warning":
      return 0.8;
  }
}

type Sound = SoundEffect | Background | "warning";

export type SoundEffect = "click" | "rollover"

export type Background = "opening" | "game" | "victory" | "loss"
