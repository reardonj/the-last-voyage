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
