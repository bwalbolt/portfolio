interface PerimeterPosition {
  x: number;
  y: number;
}

/** Extend the center-to-pointer ray to the edge of a normalized rectangle. */
export function projectPointer(
  x: number,
  y: number,
  width: number,
  height: number,
  previous: PerimeterPosition = { x: 0, y: 0 },
): PerimeterPosition {
  if (width <= 0 || height <= 0) return previous;
  const dx = Math.max(-1, Math.min(1, 2 * x / width - 1));
  const dy = Math.max(-1, Math.min(1, 2 * y / height - 1));
  const scale = Math.max(Math.abs(dx), Math.abs(dy));
  // The center has no direction. Keep the last edge position rather than jump.
  if (scale === 0) return previous;
  return { x: (dx / scale + 1) / 2, y: (dy / scale + 1) / 2 };
}
