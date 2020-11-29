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

export default class AstronomicalMath {

  /***
   * The constant for gravitational force, in units of (million km^3) / (10^23 kg • day)
   */
  public static readonly GravitationalConstant = 0.00004982;

  /***
   * The acceleration of 1g in units of 1 million km/minute^2
   */
  public static readonly Acceleration1GMin = 0.00003531;

  /***
   * The acceleration of 1g in units of 1 million km/day^2
   */
  public static readonly Acceleration1GDay = 73.21;

  public static distance(a: [number, number], b: [number, number]): number {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
  }

  /***
   * Calculates the relatavistic travel time to another object, accelerating
   * at the given speed of half the journey, then decelerating for the other
   * half.
   * @param distance in light years
   * @returns the travel times, in years.
   */
  public static travelTime(distance: number): { reference: number, relative: number } {
    const acceleration = 1.03;
    return {
      reference: 2 * (Math.sqrt(Math.pow(0.5 * distance, 2) + distance / acceleration)),
      relative: (2 / acceleration) * Math.acosh(acceleration * distance / 2 + 1)
    }
  }

  /***
   * Calculates the orbital period of a body.
   * @param a the semi-major axis of the orbit, in millions of kilometres.
   * @param centralMass the mass of the object being orbited, in units of 10^23kgs.
   * @returns the time it takes to orbit, in days.
   */
  static orbitalPeriod(a: number, centralMass: number): number {
    return 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / (this.GravitationalConstant * centralMass))
  }
}
