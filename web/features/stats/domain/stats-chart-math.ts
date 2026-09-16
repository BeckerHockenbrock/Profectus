import { ATTRIBUTE_ORDER } from "../types/stats";

export const RADAR_SIZE = 380;
export const RADAR_CENTER = RADAR_SIZE / 2;
export const RADAR_MAX_RADIUS = 118;
export const RADAR_LEVELS = [0.25, 0.5, 0.75, 1.0] as const;

export const RADAR_ANGLES = ATTRIBUTE_ORDER.map((_, i) => -Math.PI / 2 + (i * Math.PI) / 3);

export function getRadarPoint(angle: number, radius: number): { x: number; y: number } {
  return {
    x: RADAR_CENTER + radius * Math.cos(angle),
    y: RADAR_CENTER + radius * Math.sin(angle),
  };
}

export const RADAR_GRID_POLYGONS = RADAR_LEVELS.map((lvl) => {
  const radius = RADAR_MAX_RADIUS * lvl;
  const points = RADAR_ANGLES.map((a) => {
    const p = getRadarPoint(a, radius);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  });
  return points.join(" ");
});

export const RADAR_SPOKES = RADAR_ANGLES.map((a) => {
  const p = getRadarPoint(a, RADAR_MAX_RADIUS);
  return { x1: RADAR_CENTER, y1: RADAR_CENTER, x2: p.x, y2: p.y };
});
