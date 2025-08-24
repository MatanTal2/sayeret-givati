/**
 * Class name utility for conditional styling
 * Filters out falsy values and joins class names
 */
export function cn(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

