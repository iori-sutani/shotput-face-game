export type ExpressionMetrics = {
  eyeOpen: number;
  mouthOpen: number;
};

// Simple difference-based score (0..1)
export function calcExpressionScore(base: ExpressionMetrics, current: ExpressionMetrics): number {
  const deye = Math.abs(current.eyeOpen - base.eyeOpen);
  const dmouth = Math.abs(current.mouthOpen - base.mouthOpen);
  // normalize and combine
  const score = Math.min(1, (deye + dmouth) / 2);
  return score;
}

// Map score (0..1) to power (e.g. 5 .. 25)
export function scoreToPower(score: number): number {
  const min = 6;
  const max = 22;
  return min + (max - min) * Math.max(0, Math.min(1, score));
}

// Map power to distance (simple projectile model scaling)
export function powerToDistance(power: number): number {
  // simple scaling for prototype
  return Math.round((power * power) / 10 * 10) / 10; // one decimal
}

export default {};
