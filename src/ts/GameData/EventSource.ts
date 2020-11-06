import Phaser from 'phaser'

export const Source = new Phaser.Events.EventEmitter();

export const TimePassed = "timePassed";

export interface TimePassedEvent {
  earth: number;
  relative: number;
}

