import { describe, it, expect } from 'vitest';
import { SpellSchema } from '../schemas/index.js';

describe('Data Schemas', () => {
  describe('SpellSchema', () => {
    it('validates a correct spell payload', () => {
      const payload = {
        index: 'fireball',
        name: 'Fireball',
        level: 3,
        school: { index: 'evocation', name: 'Evocation', url: '' },
        classes: [{ index: 'wizard', name: 'Wizard', url: '' }],
        subclasses: [],
        desc: ['A bright streak flashes...'],
        higher_level: ['When you cast this spell...'],
        range: '150 feet',
        components: ['V', 'S', 'M'],
        material: 'A tiny ball of bat guano',
        ritual: false,
        duration: 'Instantaneous',
        concentration: false,
        casting_time: '1 action',
        url: '/api/spells/fireball',
      };
      
      const result = SpellSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('fails when required fields are missing', () => {
      const result = SpellSchema.safeParse({ name: 'Incomplete Spell' });
      expect(result.success).toBe(false);
    });
  });
});
