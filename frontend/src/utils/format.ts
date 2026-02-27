export function formatReadableId(prefix: string, value: string): string {
  const compact = value.replace(/-/g, '').toUpperCase();
  const tail = compact.slice(-6);
  return `${prefix}-${tail}`;
}
