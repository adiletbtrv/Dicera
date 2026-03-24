import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const RULES = [
  {
    category: 'Core Mechanics',
    entries: [
      { title: 'Ability Checks', text: 'Roll d20 + ability modifier + proficiency bonus (if applicable). Meet or beat the DC to succeed.' },
      { title: 'Advantage / Disadvantage', text: 'Roll 2d20 and take the higher (advantage) or lower (disadvantage). They cancel each other out.' },
      { title: 'Proficiency Bonus', text: 'Ranges from +2 (levels 1-4) to +6 (levels 17-20). Applies to attack rolls, ability checks, and saving throws you are proficient in.' },
    ],
  },
  {
    category: 'Combat',
    entries: [
      { title: 'Action Economy', text: 'On your turn: one Action, one Bonus Action, one Reaction (per round), and Movement up to your speed.' },
      { title: 'Attack Roll', text: 'Roll d20 + attack modifier. Equal or greater than target AC = hit. A natural 20 is a critical hit (double the damage dice).' },
      { title: 'Surprise', text: 'If surprised, a creature can\'t move or take actions on its first turn. It also can\'t take reactions until that turn ends.' },
      { title: 'Flanking (Optional)', text: 'If two allies are on opposite sides of an enemy, both have advantage on melee attacks against it.' },
    ],
  },
  {
    category: 'Spellcasting',
    entries: [
      { title: 'Concentration', text: 'Some spells require concentration. Taking damage requires a CON save (DC = 10 or half damage, whichever is higher). Only one concentration spell at a time.' },
      { title: 'Ritual Casting', text: 'Spells with the ritual tag can be cast in 10 minutes without expending a spell slot, if you have the ritual caster feature.' },
      { title: 'Upcasting', text: 'Spells cast with a higher-level slot may improve: extra damage dice, targets, or duration as listed in the spell\'s description.' },
    ],
  },
  {
    category: 'Resting',
    entries: [
      { title: 'Short Rest', text: 'At least 1 hour. Spend hit dice to recover HP (roll HD + CON modifier per die). Some class features recharge.' },
      { title: 'Long Rest', text: 'At least 8 hours of light activity/sleep. Regain all HP, all spell slots, and all expended long-rest features. Max 1 long rest per 24 hours.' },
    ],
  },
  {
    category: 'Conditions (Quick Reference)',
    entries: [
      { title: 'Restrained', text: 'Speed 0. Attacks against = advantage. Own attacks = disadvantage. DEX saves = disadvantage.' },
      { title: 'Incapacitated', text: 'Cannot take actions or reactions.' },
      { title: 'Prone', text: 'Crawling only unless you stand. Attacks against = advantage if attacker melee (5 ft), disadvantage if ranged. Own melee = disadvantage.' },
    ],
  },
];

export function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="w-7 h-7" style={{ color: 'var(--accent)' }} />
        <h1 className="font-heading text-3xl font-bold">Quick Rules Reference</h1>
      </div>
      <div className="space-y-8">
        {RULES.map((section, i) => (
          <motion.div key={section.category} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <h2 className="font-heading text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>{section.category}</h2>
            <div className="space-y-3">
              {section.entries.map((entry) => (
                <div key={entry.title} className="card">
                  <h3 className="font-ui font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{entry.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{entry.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
