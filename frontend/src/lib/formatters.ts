/**
 * Formats large engagement numbers in compact social-media style:
 * 950 -> 950
 * 1,200 -> 1.2K
 * 1,850 -> 1.8K
 * 12,400 -> 12.4K
 * 1,000,000 -> 1M
 */
export function formatCompactNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num) || num <= 0) return '0';
  if (num < 1000) return num.toString();
  if (num < 1_000_000) {
    const val = num / 1000;
    const formatted = val.toFixed(1);
    return formatted.endsWith('.0') ? `${Math.floor(val)}K` : `${formatted}K`;
  }
  const val = num / 1_000_000;
  const formatted = val.toFixed(1);
  return formatted.endsWith('.0') ? `${Math.floor(val)}M` : `${formatted}M`;
}
