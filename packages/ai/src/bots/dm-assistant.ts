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

const DM_SYSTEM_PROMPT = `You are an expert Dungeon Master assistant for D&D 5th Edition.
Provide practical, actionable advice using official 5e rules and best DM practices.
Be specific, creative, and concise. Reference specific mechanics when helpful.
Prioritize player engagement, balanced encounters, and narrative coherence.`;

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
