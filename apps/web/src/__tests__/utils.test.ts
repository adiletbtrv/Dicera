import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils.js';

describe('Frontend Utils', () => {
  describe('cn()', () => {
    it('merges tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'bg-red-500', { 'text-white': true, 'hidden': false });
      expect(result).toBe('px-2 py-1 bg-red-500 text-white');
    });

    it('handles tailwind conflicts natively using tailwind-merge', () => {
      // px-2 and px-4 conflict, px-4 should win since it's applied last
      const result = cn('px-2 py-1', 'px-4');
      expect(result).toBe('py-1 px-4');
    });
  });
});
