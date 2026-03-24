export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  finish_reason: string;
}

export interface RagChunk {
  id: string;
  content: string;
  source: string;
  page?: number;
  section?: string;
  embedding?: number[];
  score?: number;
}

export interface RagResult {
  answer: string;
  sources: RagChunk[];
  confidence: 'high' | 'medium' | 'low';
}

export interface LlmProvider {
  chat(messages: ChatMessage[], options?: LlmChatOptions): Promise<LlmResponse>;
  embed(text: string): Promise<number[]>;
}

export interface LlmChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  systemPrompt?: string;
}

export interface VectorStore {
  upsert(chunks: RagChunk[]): Promise<void>;
  search(query: string, topK?: number): Promise<RagChunk[]>;
  delete(ids: string[]): Promise<void>;
}
