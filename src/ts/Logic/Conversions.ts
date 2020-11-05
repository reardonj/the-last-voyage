export const GigametersPerDayToMetresPerSecond = 11574;
export const MetresPerSecondToPercentLightSpeed = 1/299800000;

export function GigametersPerDayToLightSpeedPercent(velocity: number): string {
  return (velocity * GigametersPerDayToMetresPerSecond * MetresPerSecondToPercentLightSpeed * 100).toFixed(2) + " c";
}
