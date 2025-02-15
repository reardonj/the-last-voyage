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

import { Math as M } from 'phaser';
import AstronomicalMath from './AstronomicalMath';

export class GravitySimulation {
  readonly wells: GravityWell[];

  constructor(wells: GravityWell[]) {
    this.wells = [...wells];
  }

  /***
   * Calculate the position of a body, with steps in the given resolution.
   * @param initialAcc initial acceleration, in units of million km / day^2
   */
  *calculate(
    startTime: number,
    daysPerFrame: number,
    position: M.Vector2,
    velocity: M.Vector2,
    initialAcc: M.Vector2)
    : IterableIterator<[pos: M.Vector2, vel: M.Vector2, acc: M.Vector2]> {
    const delta = daysPerFrame;

    let time = startTime;
    let acc = initialAcc;
    let vel = velocity;
    let pos = position;

    while (true) {
      yield [pos, vel.clone(), acc.clone()];
      const newPos = pos.clone().add(vel.clone().scale(delta).add(acc.clone().scale(delta * delta * 0.5)));
      const newAcc = this.applyGravity(pos, time);
      vel.add(acc.add(newAcc).scale(delta * 0.5));
      pos = newPos;
      acc = newAcc;
      time += daysPerFrame * 24 * 60;
    }
  }

  private applyGravity(position: M.Vector2, time: number): M.Vector2 {
    let acc = new M.Vector2();
    let pos = new M.Vector2();
    for (let body of this.wells) {
      const distSqr = body.positionAt(time).distanceSq(position);
      const force = AstronomicalMath.GravitationalConstant * body.mass / distSqr;
      acc.add(pos.copy(body.positionAt(time)).subtract(position).normalize().scale(force));
    }

    return acc;
  }
}

export interface GravityWell {
  positionAt(minutes: number): M.Vector2;
  readonly mass: number;
}
