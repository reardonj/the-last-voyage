export const GigametersPerDayToMetresPerSecond = 11574;
export const MetresPerSecondToPercentLightSpeed = 1/299800000;

export function gigametersPerDayToLightSpeedPercent(velocity: number): number {
  return velocity * GigametersPerDayToMetresPerSecond * MetresPerSecondToPercentLightSpeed;
}

export function contractTime(minutes: number, percentLightSpeed: number): number {
  return minutes * Math.sqrt(1-percentLightSpeed);
}
