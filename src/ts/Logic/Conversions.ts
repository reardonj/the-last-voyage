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

export const GigametersPerDayToMetresPerSecond = 11574;
export const MetresPerSecondToPercentLightSpeed = 1 / 299800000;

export function gigametersPerDayToLightSpeedPercent(velocity: number): number {
  return velocity * GigametersPerDayToMetresPerSecond * MetresPerSecondToPercentLightSpeed;
}

export function contractTime(minutes: number, percentLightSpeed: number): number {
  return minutes * Math.sqrt(1 - percentLightSpeed);
}

export const YearInMinutes = 524160;
