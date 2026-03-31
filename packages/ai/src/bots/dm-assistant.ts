import type { ChatMessage, LlmChatOptions, LlmProvider, LlmResponse } from '../types.js';
import type { CampaignContext } from './story-bot.js';

export interface EncounterContext {
  partyLevel: number;
  partySize: number;
  partyComposition?: string[];
  currentLocation?: string;
  campaignArc?: string;
  desiredDifficulty?: 'easy' | 'medium' | 'hard' | 'deadly';
  theme?: string;
}

export const DM_SYSTEM_PROMPT = `
# ROLE AND PERSONA
You are an elite, veteran Dungeon Master (DM) running a Dungeons & Dragons 5th Edition campaign. You are a master storyteller, a fair and impartial referee, and an immersive world-builder. Your tone is highly atmospheric, descriptive, and responsive to the player's choices. 

# CORE DIRECTIVES
1. **Never Play the Player:** You dictate the world, the NPCs, the weather, and the consequences of actions. You MUST NEVER dictate what the player's character thinks, feels, says, or does. 
2. **Show, Don't Tell:** Engage the five senses. Describe the smell of ozone after a spell, the metallic taste of blood, or the scraping of stone. 
3. **The "Yes, and..." Principle:** Encourage player creativity. If they try something unconventional, do not block them—call for a relevant skill check and set a realistic Difficulty Class (DC).
4. **Mechanical Precision:** When rules, spells, or combat are involved, strictly adhere to D&D 5e SRD rules.

# GAMEPLAY LOOP & MECHANICS
When the player attempts an action that has a chance of failure:
- **Halt the narrative.** Do not describe the outcome yet.
- **Request a roll.** Explicitly tell the player what to roll (e.g., "Roll a Dexterity (Stealth) check," "Make a DC 14 Constitution saving throw").
- Wait for the player to provide the roll result before continuing the story.

# CONTEXT AWARENESS (RAG)
You have access to the player's Character Sheet, Inventory, and Campaign Notes in your system context. 
- Use the character's name, race, and class in your descriptions.
- If a player tries to use an item or spell they do not possess, gently remind them of their actual inventory/spell slots.
- Take note of their active conditions (e.g., if they are "Blinded", describe their reliance on sound and touch).

# FORMATTING RULES
- Use **bold** for mechanical terms (e.g., **Advantage**, **1d6 slashing damage**, **DC 15**).
- Use *italics* for internal NPC thoughts or magical whispers.
- Keep responses concise and paced. Do not write a 5-paragraph monologue unless introducing a major new location. End your response by handing the agency back to the player (e.g., "What do you do?").

# SAFETY & BOUNDARIES
Keep the adventure PG-13 / R-rated. Fade to black for extreme gore or intimate encounters. Maintain a safe, respectful environment.
`;

export class DmAssistant {
  constructor(private readonly llm: LlmProvider) {}

  async suggestEncounter(ctx: EncounterContext, options: LlmChatOptions = {}): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: DM_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          `Design a ${ctx.desiredDifficulty ?? 'medium'} encounter for:`,
          `- Party: ${ctx.partySize} players, level ${ctx.partyLevel}`,
          ctx.partyComposition?.length
            ? `- Composition: ${ctx.partyComposition.join(', ')}`
            : '',
          ctx.currentLocation ? `- Location: ${ctx.currentLocation}` : '',
          ctx.theme ? `- Theme/flavor: ${ctx.theme}` : '',
          ctx.campaignArc ? `- Campaign arc: ${ctx.campaignArc}` : '',
          '',
          'Include:',
          '- Monster selection with quantity (and CRs)',
          '- Battlefield features/terrain',
          '- Tactical considerations',
          '- A twist or complication',
          '- Suggested monster tactics',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ];

    const response = await this.llm.chat(messages, { temperature: 0.8, maxTokens: 1024, ...options });
    return response.content;
  }

  async adjudicateRule(ruleQuestion: string, options: LlmChatOptions = {}): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: DM_SYSTEM_PROMPT + '\nAlways cite the relevant rulebook and page if possible.',
      },
      { role: 'user', content: ruleQuestion },
    ];

    const response = await this.llm.chat(messages, { temperature: 0.3, maxTokens: 512, ...options });
    return response.content;
  }

  async generateTreasure(
    partyLevel: number,
    encounterType: 'individual' | 'hoard',
    monsterCR?: number,
    options: LlmChatOptions = {},
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: DM_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Generate ${encounterType} treasure for:
- Party level: ${partyLevel}
${monsterCR !== undefined ? `- Monster CR: ${monsterCR}` : ''}

Use the DMG treasure tables as a guide. Include:
- Coin amounts by denomination
- Any gems or art objects (with values)
- Magic items (if appropriate for the level)
- A flavor description of how the treasure is found`,
      },
    ];

    const response = await this.llm.chat(messages, { temperature: 0.7, maxTokens: 512, ...options });
    return response.content;
  }

  async improveSession(
    issues: string,
    campaignContext?: CampaignContext,
    options: LlmChatOptions = {},
  ): Promise<string> {
    const contextStr = campaignContext
      ? `\nCampaign: ${campaignContext.campaignName}\nSetting: ${campaignContext.setting ?? 'unknown'}\nTone: ${campaignContext.tone ?? 'standard'}`
      : '';

    const messages: ChatMessage[] = [
      { role: 'system', content: DM_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `I'm having this challenge with my D&D session:${contextStr}\n\n${issues}\n\nGive me 3-5 specific, actionable suggestions to address this.`,
      },
    ];

    const response = await this.llm.chat(messages, { temperature: 0.7, maxTokens: 768, ...options });
    return response.content;
  }

  async chat(
    history: ChatMessage[],
    userMessage: string,
    options: LlmChatOptions = {},
  ): Promise<LlmResponse> {
    const messages: ChatMessage[] = [
      { role: 'system', content: DM_SYSTEM_PROMPT },
      ...history.slice(-20),
      { role: 'user', content: userMessage },
    ];

    return this.llm.chat(messages, { temperature: 0.7, maxTokens: 1024, ...options });
  }
}
