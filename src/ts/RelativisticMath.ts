export default class RelativisticMath {
	public static sh(x: number): number {
		return (Math.pow(Math.E, x) - Math.pow(Math.E, -x))/2;
	}
}
