import GameState from "./GameState"

export type LogSummary = {
  victories: number,
  failures: number,
  posthumousVictories: number,
  quickestVictory?: number,
  quickestFailure?: number,
  mostColonies?: number
}

export type Ending = "victory" | "failure" | "resigned" | "posthumous";

export function initialLog(): LogSummary {
  return {
    victories: 0,
    failures: 0,
    posthumousVictories: 0
  }
}

export function updateLog(log: LogSummary, ending: Ending, endingTime: number): LogSummary {
  return {
    victories: log.victories + (ending === "victory" ? 1 : 0),
    failures: log.failures + (ending === "failure" || ending === "resigned" ? 1 : 0),
    posthumousVictories: log.posthumousVictories + (ending === "posthumous" ? 1 : 0),
    quickestVictory: ending === "victory" ? Math.min(log.quickestVictory ?? Number.MAX_SAFE_INTEGER, endingTime) : log.quickestVictory,
    quickestFailure: ending === "failure" ? Math.min(log.quickestFailure ?? Number.MAX_SAFE_INTEGER, endingTime) : log.quickestFailure
  }
}
