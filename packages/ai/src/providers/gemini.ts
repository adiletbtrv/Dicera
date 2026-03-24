import type { ChatMessage, LlmChatOptions, LlmProvider, LlmResponse } from '../types.js';

export interface GeminiConfig {
    apiKey: string;
    defaultModel?: string;
    embeddingModel?: string;
}

export class GeminiProvider implements LlmProvider {
    private readonly apiKey: string;
    private readonly defaultModel: string;
    private readonly embeddingModel: string;

    constructor(config: GeminiConfig) {
        this.apiKey = config.apiKey;
        this.defaultModel = config.defaultModel ?? 'gemini-2.5-flash';
        this.embeddingModel = config.embeddingModel ?? 'text-embedding-004';
    }

    async chat(messages: ChatMessage[], options: LlmChatOptions = {}): Promise<LlmResponse> {
        const model = options.model ?? this.defaultModel;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

        const contents: any[] = [];
        let systemInstruction: any = undefined;

        for (const msg of messages) {
            if (msg.role === 'system') {
                if (!systemInstruction) {
                    systemInstruction = { parts: [{ text: msg.content }] };
                } else {
                    systemInstruction.parts.push({ text: msg.content });
                }
            } else {
                const role = msg.role === 'assistant' ? 'model' : 'user';
                contents.push({
                    role,
                    parts: [{ text: msg.content }]
                });
            }
        }

        const payload: any = {
            contents,
        };

        if (systemInstruction) {
            payload.systemInstruction = systemInstruction;
        }

        if (options.temperature !== undefined || options.maxTokens !== undefined) {
            payload.generationConfig = {
                temperature: options.temperature,
                maxOutputTokens: options.maxTokens,
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini API error ${response.status}: ${err}`);
        }

        const data = await response.json();

        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text ?? '';

        return {
            content: text,
            usage: {
                prompt_tokens: data.usageMetadata?.promptTokenCount ?? 0,
                completion_tokens: data.usageMetadata?.candidatesTokenCount ?? 0,
                total_tokens: data.usageMetadata?.totalTokenCount ?? 0,
            },
            model,
            finish_reason: candidate?.finishReason ?? 'stop',
        };
    }

    async embed(text: string): Promise<number[]> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.embeddingModel}:embedContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: `models/${this.embeddingModel}`,
                content: { parts: [{ text }] },
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini Embeddings API error ${response.status}: ${err}`);
        }

        const data = await response.json();
        return data.embedding?.values ?? [];
    }
}
