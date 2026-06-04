/**
 * Move an element in an array from one index to another, returning a new array.
 * Used by both frontend optimistic updates and server logic.
 */
export function reorder<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return list;
  if (fromIndex < 0 || fromIndex >= list.length) return list;
  if (toIndex < 0 || toIndex >= list.length) return list;

  const result = [...list];
  const [item] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, item);
  return result;
}

/**
 * Renumber positions using integer spacing (i * 1024).
 * Returns array of { index, position } for items that need updating.
 */
export function renumberPositions(count: number): Array<{ index: number; position: number }> {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    position: i * 1024,
  }));
}

/**
 * Compute a midpoint position between two neighbors.
 * Used for single-item reorder without renumbering the whole list.
 */
export function midpointPosition(before: number | null, after: number | null): number {
  if (before == null && after == null) return 0;
  if (before == null) return after! - 1024;
  if (after == null) return before + 1024;
  return (before + after) / 2;
}
