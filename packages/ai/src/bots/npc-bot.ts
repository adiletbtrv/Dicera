import type { ChatMessage, LlmChatOptions, LlmProvider, LlmResponse } from '../types.js';

export interface NpcPersona {
  name: string;
  race?: string;
  occupation?: string;
  personality: string;
  motivations?: string;
  secrets?: string;
  speakingStyle?: string;
  relationshipToParty?: string;
  campaignContext?: string;
}

export class NpcBot {
  constructor(private readonly llm: LlmProvider) {}

  async generateDialogue(
    persona: NpcPersona,
    playerMessage: string,
    conversationHistory: ChatMessage[] = [],
    options: LlmChatOptions = {},
  ): Promise<LlmResponse> {
    const systemPrompt = this.buildSystemPrompt(persona);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: 'user', content: playerMessage },
    ];

    return this.llm.chat(messages, {
      temperature: options.temperature ?? 0.85,
      maxTokens: options.maxTokens ?? 512,
    });
  }

  async generateRumors(persona: NpcPersona, topic?: string): Promise<string> {
    const prompt = topic
      ? `Generate 3 rumors or pieces of information that ${persona.name} might share about: ${topic}`
      : `Generate 3 rumors or local gossip that ${persona.name} might share with travelers.`;

    const response = await this.llm.chat([
      { role: 'system', content: this.buildSystemPrompt(persona) },
      { role: 'user', content: prompt },
    ]);
    return response.content;
  }

  async generateFirstImpression(persona: NpcPersona): Promise<string> {
    const response = await this.llm.chat([
      {
        role: 'system',
        content:
          'You are a DM narrating a D&D encounter. Write vivid, concise descriptions in second person.',
      },
      {
        role: 'user',
        content: `Describe the first impression of meeting ${persona.name}, ${persona.race ?? ''} ${persona.occupation ?? 'NPC'}. Their personality: ${persona.personality}. Keep it to 2-3 sentences.`,
      },
    ]);
    return response.content;
  }

  private buildSystemPrompt(persona: NpcPersona): string {
    const parts = [
      `You are ${persona.name}, a ${persona.race ?? 'person'} working as ${persona.occupation ?? 'an NPC'} in a Dungeons & Dragons campaign.`,
      `Personality: ${persona.personality}`,
    ];

    if (persona.motivations) parts.push(`Motivations: ${persona.motivations}`);
    if (persona.secrets) parts.push(`(Secret - never reveal directly): ${persona.secrets}`);
    if (persona.speakingStyle) parts.push(`Speaking style: ${persona.speakingStyle}`);
    if (persona.relationshipToParty) parts.push(`Relationship to party: ${persona.relationshipToParty}`);
    if (persona.campaignContext) parts.push(`Campaign context: ${persona.campaignContext}`);

    parts.push(
      'Stay in character at all times. Respond as this character would, not as an AI.',
      'Keep responses natural and conversational, 1-4 sentences unless asked for more.',
      'Never break character to explain D&D mechanics unless your character would know them.',
    );

    return parts.join('\n');
  }
}
