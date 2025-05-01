
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and tailwind-merge
 * for more efficient class name handling
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
