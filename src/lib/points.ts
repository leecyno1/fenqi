export const POINT_SCALE = 100;

export function scaleDownPoints(value: number) {
  return Math.round(value / POINT_SCALE);
}

export function scaleDownPositivePoints(value: number) {
  if (value <= 0) {
    return 0;
  }

  return Math.max(1, scaleDownPoints(value));
}
