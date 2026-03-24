import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const CONDITIONS = [
  {
    id: 'blinded',
    name: 'Blinded',
    category: 'perception',
    rules: [
      'A blinded creature can\'t see and automatically fails any ability check that requires sight.',
      'Attack rolls against the creature have advantage, and the creature\'s attack rolls have disadvantage.',
    ],
  },
  {
    id: 'charmed',
    name: 'Charmed',
    category: 'mental',
    rules: [
      'A charmed creature can\'t attack the charmer or target the charmer with harmful abilities or magical effects.',
      'The charmer has advantage on any ability check to interact socially with the creature.',
    ],
  },
  {
    id: 'deafened',
    name: 'Deafened',
    category: 'perception',
    rules: [
      'A deafened creature can\'t hear and automatically fails any ability check that requires hearing.',
    ],
  },
  {
    id: 'exhaustion',
    name: 'Exhaustion',
    category: 'debilitating',
    rules: [
      'Level 1: Disadvantage on ability checks.',
      'Level 2: Speed halved.',
      'Level 3: Disadvantage on attack rolls and saving throws.',
      'Level 4: Hit point maximum halved.',
      'Level 5: Speed reduced to 0.',
      'Level 6: Death.',
      'Finishing a long rest reduces exhaustion by 1 level, provided the creature has also ingested some food and drink.',
    ],
  },
  {
    id: 'frightened',
    name: 'Frightened',
    category: 'mental',
    rules: [
      'A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight.',
      'The creature can\'t willingly move closer to the source of its fear.',
    ],
  },
  {
    id: 'grappled',
    name: 'Grappled',
    category: 'movement',
    rules: [
      'A grappled creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed.',
      'The condition ends if the grappler is incapacitated.',
      'The condition also ends if an effect removes the grappled creature from the reach of the grappler or grappling effect.',
    ],
  },
  {
    id: 'incapacitated',
    name: 'Incapacitated',
    category: 'debilitating',
    rules: [
      'An incapacitated creature can\'t take actions or reactions.',
    ],
  },
  {
    id: 'invisible',
    name: 'Invisible',
    category: 'perception',
    rules: [
      'An invisible creature is impossible to see without the aid of magic or a special sense.',
      'The creature\'s location can be detected by any noise it makes or any tracks it leaves.',
      'Attack rolls against the creature have disadvantage, and the creature\'s attack rolls have advantage.',
    ],
  },
  {
    id: 'paralyzed',
    name: 'Paralyzed',
    category: 'debilitating',
    rules: [
      'A paralyzed creature is incapacitated and can\'t move or speak.',
      'The creature automatically fails Strength and Dexterity saving throws.',
      'Attack rolls against the creature have advantage.',
      'Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.',
    ],
  },
  {
    id: 'petrified',
    name: 'Petrified',
    category: 'debilitating',
    rules: [
      'A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone).',
      'The creature is incapacitated, can\'t move or speak, and is unaware of its surroundings.',
      'Attack rolls against the creature have advantage.',
      'The creature automatically fails Strength and Dexterity saving throws.',
      'The creature has resistance to all damage.',
      'The creature is immune to poison and disease, although a poison or disease already in its system is suspended.',
    ],
  },
  {
    id: 'poisoned',
    name: 'Poisoned',
    category: 'debilitating',
    rules: [
      'A poisoned creature has disadvantage on attack rolls and ability checks.',
    ],
  },
  {
    id: 'prone',
    name: 'Prone',
    category: 'movement',
    rules: [
      'A prone creature\'s only movement option is to crawl, unless it stands up and thereby ends the condition.',
      'The creature has disadvantage on attack rolls.',
      'An attack roll against the creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the attack roll has disadvantage.',
    ],
  },
  {
    id: 'restrained',
    name: 'Restrained',
    category: 'movement',
    rules: [
      'A restrained creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed.',
      'Attack rolls against the creature have advantage, and the creature\'s attack rolls have disadvantage.',
      'The creature has disadvantage on Dexterity saving throws.',
    ],
  },
  {
    id: 'stunned',
    name: 'Stunned',
    category: 'debilitating',
    rules: [
      'A stunned creature is incapacitated, can\'t move, and can speak only falteringly.',
      'The creature automatically fails Strength and Dexterity saving throws.',
      'Attack rolls against the creature have advantage.',
    ],
  },
  {
    id: 'unconscious',
    name: 'Unconscious',
    category: 'debilitating',
    rules: [
      'An unconscious creature is incapacitated, can\'t move or speak, and is unaware of its surroundings.',
      'The creature drops whatever it\'s holding and falls prone.',
      'The creature automatically fails Strength and Dexterity saving throws.',
      'Attack rolls against the creature have advantage.',
      'Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.',
    ],
  },
];

router.get('/', (req, res) => {
  const q = z.string().optional().parse(req.query['q']);
  const data = q
    ? CONDITIONS.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    : CONDITIONS;
  res.json(data);
});

export { router as conditionsRouter };
