export default class Utilities {
	/**
	 * Logs a particular message to the console.
	 * @param message Message to log.
	 */
	public static Log(message: string): void {
		console.log((new Date()).toISOString() + " : " + message);
	}
}
