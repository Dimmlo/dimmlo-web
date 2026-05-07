// Daily send limit by warmup day. Mirrors rugby-tours warmup schedule.
export function getDailyLimit(warmupDay: number): number {
  if (warmupDay <= 3) return 5;
  if (warmupDay <= 7) return 10;
  if (warmupDay <= 14) return 20;
  if (warmupDay <= 21) return 40;
  return 100;
}
