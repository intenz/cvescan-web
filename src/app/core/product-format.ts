/** Human-readable product label: underscores → spaces, title case. */
export function formatProductLabel(product: string | null | undefined): string {
  if (!product?.trim()) return '—';

  return product
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => {
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}
