/**
 * Utility functions for string manipulation
 */

export function reverseString(str: string): string {
  return str.split('').reverse().join('');
}

export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}