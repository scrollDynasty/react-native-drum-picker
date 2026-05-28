export function getItemLabel<T>(item: T): string {
  if (typeof item === 'string') {
    return item;
  }
  if (item != null && typeof item === 'object') {
    const maybeLabel = (item as { label?: unknown }).label;
    if (typeof maybeLabel === 'string') {
      return maybeLabel;
    }
    const maybeValue = (item as { value?: unknown }).value;
    if (typeof maybeValue === 'string' || typeof maybeValue === 'number') {
      return String(maybeValue);
    }
  }
  return String(item ?? '');
}
