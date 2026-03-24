import type { ChatMessage, LlmChatOptions, LlmProvider, LlmResponse } from '../types.js';

export interface CampaignContext {
  campaignName: string;
  setting?: string;
  currentArc?: string;
  recentEvents?: string;
  playerCharacters?: Array<{
    name: string;
    race: string;
    class: string;
    background?: string;
  }>;
  importantNpcs?: string[];
  importantLocations?: string[];
  tone?: 'heroic' | 'gritty' | 'comedic' | 'horror' | 'mystery' | 'political';
}

const STORY_SYSTEM_PROMPT = `You are a creative storytelling assistant for a Dungeons & Dragons campaign.
Generate vivid, engaging narrative content that fits the campaign tone and respects player agency.
Write in a style appropriate for D&D: atmospheric, action-ready, and lore-consistent.
Always give players meaningful choices and avoid railroading. Format output clearly.`;

export class StoryBot {
  constructor(private readonly llm: LlmProvider) { }

  async generateSessionHook(context: CampaignContext, options: LlmChatOptions = {}): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: STORY_SYSTEM_PROMPT },
      {
        role: 'user',
        content: this.buildContextHeader(context) +
          '\n\nGenerate an exciting opening hook or "session zero" intro for the next session. Include:\n- A compelling inciting event\n- An immediate decision point for the players\n- 2-3 possible leads or directions\nKeep it to 3-4 paragraphs.',
      },
    ];

    const response = await this.llm.chat(messages, { temperature: 0.9, ...options });
    return response.content;
  }

  async generatePlotHook(
    context: CampaignContext,
    hookType?: string,
    options: LlmChatOptions = {},
  ): Promise<string> {
    const type = hookType ?? 'side quest';
    const messages: ChatMessage[] = [
      { role: 'system', content: STORY_SYSTEM_PROMPT },
      {
        role: 'user',
        content: this.buildContextHeader(context) +
          `\n\nGenerate a ${type} plot hook that:\n- Connects to the existing campaign elements\n- Gives at least one PC a personal stake\n- Can be completed in 1-3 sessions\n- Has a moral complexity or interesting twist`,
      },
    ];

    const response = await this.llm.chat(messages, { temperature: 0.9, ...options });
    return response.content;
  }

  async generateLocationDescription(
    locationName: string,
    locationType: string,
    context?: CampaignContext,
    options: LlmChatOptions = {},
  ): Promise<string> {
    const contextBlock = context ? this.buildContextHeader(context) + '\n\n' : '';
    const messages: ChatMessage[] = [
      { role: 'system', content: STORY_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${contextBlock}Write a vivid description of ${locationName} (${locationType}) for a DM to read aloud to players. Include:\n- Sensory details (sight, sound, smell)\n- Notable features players might interact with\n- Atmosphere and mood\n- 1-2 subtle details that hint at history or secrets\nLength: 2-3 paragraphs.`,
      },
    ];

    const response = await this.llm.chat(messages, { temperature: 0.85, ...options });
    return response.content;
  }

  async continueStory(
    history: ChatMessage[],
    playerAction: string,
    context?: CampaignContext,
    options: LlmChatOptions = {},
  ): Promise<LlmResponse> {
    const contextBlock = context ? this.buildContextHeader(context) + '\n\n' : '';
    const systemContent = STORY_SYSTEM_PROMPT + (contextBlock ? `\n\nCampaign context:\n${contextBlock}` : '');

    const messages: ChatMessage[] = [
      { role: 'system', content: systemContent },
      ...history.slice(-20),
      { role: 'user', content: `Player action: ${playerAction}` },
    ];

    return this.llm.chat(messages, { temperature: 0.85, maxTokens: 768, ...options });
  }

  private buildContextHeader(context: CampaignContext): string {
    const parts = [`Campaign: "${context.campaignName}"`];
    if (context.setting) parts.push(`Setting: ${context.setting}`);
    if (context.currentArc) parts.push(`Current arc: ${context.currentArc}`);
    if (context.recentEvents) parts.push(`Recent events: ${context.recentEvents}`);
    if (context.tone) parts.push(`Tone: ${context.tone}`);
    if (context.playerCharacters?.length) {
      const pcs = context.playerCharacters.map((pc) => `${pc.name} (${pc.race} ${pc.class})`).join(', ');
      parts.push(`Player characters: ${pcs}`);
    }
    if (context.importantNpcs?.length) {
      parts.push(`Important NPCs: ${context.importantNpcs.join(', ')}`);
    }
    if (context.importantLocations?.length) {
      parts.push(`Key locations: ${context.importantLocations.join(', ')}`);
    }
    return parts.join('\n');
  }
}
