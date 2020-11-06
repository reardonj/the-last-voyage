export default class GameState implements SavedState {
  
  earthTime: number;
  relativeTime: number;
  eventSource: Phaser.Events.EventEmitter;

  constructor(savedState: SavedState) {
    this.earthTime = savedState.earthTime;
    this.relativeTime = savedState.relativeTime;
    this.eventSource = new Phaser.Events.EventEmitter();
  }

  updateTime(earth: number, relative: number) {
    this.earthTime += earth;
    this.relativeTime += relative;
    this.eventSource.emit(Events.TimePassed, {earth: this.earthTime, relative: this.relativeTime});
  }
}

export interface SavedState {
  earthTime: number,
  relativeTime: number
}

export const Events = {
  TimePassed: "timePassed"
}

export interface TimePassedEvent {
  earth: number;
  relative: number;
}
