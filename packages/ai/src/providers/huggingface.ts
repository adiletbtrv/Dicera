import type { ChatMessage, LlmChatOptions, LlmProvider, LlmResponse } from '../types.js';

interface HuggingFaceConfig {
  apiKey: string;
  chatModel?: string;
  embeddingModel?: string;
}

interface HfInferenceResponse {
  generated_text?: string;
  error?: string;
}

interface HfEmbeddingResponse {
  embeddings?: number[][];
  error?: string;
}

export class HuggingFaceProvider implements LlmProvider {
  private readonly apiKey: string;
  private readonly chatModel: string;
  private readonly embeddingModel: string;
  private readonly baseUrl = 'https://api-inference.huggingface.co/models';

  constructor(config: HuggingFaceConfig) {
    this.apiKey = config.apiKey;
    this.chatModel = config.chatModel ?? 'mistralai/Mistral-7B-Instruct-v0.3';
    this.embeddingModel = config.embeddingModel ?? 'sentence-transformers/all-MiniLM-L6-v2';
  }

  async chat(messages: ChatMessage[], options: LlmChatOptions = {}): Promise<LlmResponse> {
    const prompt = this.formatMessages(messages);

    const response = await fetch(`${this.baseUrl}/${options.model ?? this.chatModel}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature: options.temperature ?? 0.7,
          max_new_tokens: options.maxTokens ?? 1024,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HuggingFace API error ${response.status}: ${err}`);
    }

    const data = (await response.json()) as HfInferenceResponse[];
    const text = data[0]?.generated_text ?? '';

    return {
      content: text.trim(),
      model: options.model ?? this.chatModel,
      finish_reason: 'stop',
    };
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/${this.embeddingModel}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HuggingFace Embeddings error ${response.status}: ${err}`);
    }

    const data = (await response.json()) as HfEmbeddingResponse | number[][];
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const typed = data as number[][];
      return typed[0] ?? [];
    }

    return [];
  }

  private formatMessages(messages: ChatMessage[]): string {
    return messages
      .map((m) => {
        if (m.role === 'system') return `<s>[INST] <<SYS>>\n${m.content}\n<</SYS>>\n\n`;
        if (m.role === 'user') return `${m.content} [/INST]`;
        return `${m.content} </s><s>[INST] `;
      })
      .join('');
  }
}
