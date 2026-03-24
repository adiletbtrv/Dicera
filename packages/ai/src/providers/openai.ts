import type { ChatMessage, LlmChatOptions, LlmProvider, LlmResponse } from '../types.js';

interface OpenAiConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  embeddingModel?: string;
}

interface OpenAiChatResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

interface OpenAiEmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage: { prompt_tokens: number; total_tokens: number };
}

export class OpenAiProvider implements LlmProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly embeddingModel: string;

  constructor(config: OpenAiConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://api.openai.com/v1';
    this.defaultModel = config.defaultModel ?? 'gpt-4o-mini';
    this.embeddingModel = config.embeddingModel ?? 'text-embedding-3-small';
  }

  async chat(messages: ChatMessage[], options: LlmChatOptions = {}): Promise<LlmResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model ?? this.defaultModel,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${err}`);
    }

    const data = (await response.json()) as OpenAiChatResponse;
    const choice = data.choices[0];

    return {
      content: choice?.message.content ?? '',
      usage: data.usage,
      model: data.model,
      finish_reason: choice?.finish_reason ?? 'stop',
    };
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.embeddingModel,
        input: text,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI Embeddings API error ${response.status}: ${err}`);
    }

    const data = (await response.json()) as OpenAiEmbeddingResponse;
    return data.data[0]?.embedding ?? [];
  }
}
