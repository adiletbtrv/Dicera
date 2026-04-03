import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseExpression, DICE_REGEX, MULTI_DICE_REGEX } from '../dice.js';

describe('Dice Parser', () => {
  it('DICE_REGEX strictly matches basic dice format', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // count
        fc.integer({ min: 2, max: 1000 }), // sides
        fc.option(fc.integer({ min: -100, max: 100 }), { nil: undefined }), // modifier
        (count, sides, modifier) => {
          let expr = `${count}d${sides}`;
          if (modifier !== undefined) {
             expr += modifier >= 0 ? `+${modifier}` : modifier.toString();
          }
          expect(DICE_REGEX.test(expr)).toBe(true);
        }
      )
    );
  });

  it('rejects invalid regex patterns securely', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !/^\d+d\d+([+-]\d+)?$/i.test(s)),
        (invalidStr) => {
          expect(DICE_REGEX.test(invalidStr)).toBe(false);
        }
      )
    );
  });

  it('MULTI_DICE_REGEX catches all valid occurrences', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            fc.integer({ min: 1, max: 50 }),
            fc.integer({ min: 2, max: 100 })
          ),
          { minLength: 1, maxLength: 10 }
        ),
        (diceArr) => {
          const expr = diceArr.map(([c, s]) => `${c}d${s}`).join('+');
          const matches = [...expr.matchAll(new RegExp(MULTI_DICE_REGEX, 'gi'))];
          expect(matches.length).toBe(diceArr.length);
        }
      )
    );
  });

  it('parseExpression handles valid mathematical compositions gracefully', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            count: fc.integer({ min: 1, max: 20 }),
            sides: fc.integer({ min: 2, max: 20 }),
            sign: fc.constantFrom('+', '-'),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (diceTerms) => {
          // Construct an expression like "1d6+2d4-1d8"
          const expr = diceTerms.map((t, i) => (i === 0 && t.sign === '+' ? '' : t.sign) + `${t.count}d${t.sides}`).join('');
          
          const result = parseExpression(expr);
          
          if (result.breakdown !== 'Invalid expression') {
            expect(result.expression).toBe(expr.toLowerCase());
            
            // Basic mathematical upper/lower bounds sanity check
            let maxBoundary = 0;
            let minBoundary = 0;
            
            diceTerms.forEach(t => {
                if (t.sign === '+') {
                    maxBoundary += t.count * t.sides;
                    minBoundary += t.count * 1;
                } else {
                    maxBoundary -= t.count * 1;
                    minBoundary -= t.count * t.sides;
                }
            });
            
            expect(result.total).toBeLessThanOrEqual(maxBoundary);
            expect(result.total).toBeGreaterThanOrEqual(minBoundary);
            expect(Array.isArray(result.rolls)).toBe(true);
          }
        }
      )
    );
  });
});
