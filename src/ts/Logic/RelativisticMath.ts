import { GravitySimulation } from "./GravitySimulation";

export default class RelativisticMath {
  public static readonly GravitationalConstant = 0.00004982; // (million km^3) / (10^23 kg • day)


	private static sh(x: number): number {
		return (Math.pow(Math.E, x) - Math.pow(Math.E, -x))/2;
  }
  
  /***
   * Calculates the orbital period of a body.
   * @param a the semi-major axis of the orbit, in millions of kilometres.
   * @param centralMass the mass of the object being orbited, in units of 10^23kgs.
   * @returns the number of minutes it takes to orbit, in days.
   */
  static orbitalPeriod(a: number, centralMass: number): number {
    return 2 * Math.PI * Math.sqrt(Math.pow(a, 3)/(this.GravitationalConstant * centralMass))
  }
}
