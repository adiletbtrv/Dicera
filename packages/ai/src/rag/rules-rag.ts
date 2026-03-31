import { chunkText } from '@dnd/data/etl';
import type { LlmProvider, RagChunk, RagResult, VectorStore } from '../types.js';
import { createHash } from 'crypto';

const RULES_SYSTEM_PROMPT = `You are an expert Dungeons & Dragons 5th Edition rules assistant.
Answer questions using only the provided rules context. If the answer is not in the context, say so clearly.
Always cite the source (e.g., PHB p.123) when referencing rules.
Be concise and accurate. Format rules clearly using markdown.`;

interface RulesDocument {
  title: string;
  content: string;
  source: string;
  page?: number;
}

export class RulesRag {
  constructor(
    private readonly llm: LlmProvider,
    private readonly vectorStore: VectorStore,
  ) { }

  async indexDocument(doc: RulesDocument): Promise<void> {
    const chunks = chunkText(doc.content, 512);
    const ragChunks: RagChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i] ?? '';
      const id = createHash('sha1')
        .update(`${doc.source}::${doc.title}::${i}`)
        .digest('hex')
        .substring(0, 16);

      const embedding = await this.llm.embed(
        `${doc.title}\n${chunk}`,
      );

      const ragChunk: RagChunk = {
        id,
        content: chunk,
        source: doc.source,
        section: doc.title,
        embedding,
      };
      if (doc.page !== undefined) ragChunk.page = doc.page;

      ragChunks.push(ragChunk);
    }

    await this.vectorStore.upsert(ragChunks);
  }

  async query(question: string): Promise<RagResult> {
    const queryEmbedding = await this.llm.embed(question);
    const embeddingStr = JSON.stringify(queryEmbedding);
    const relevantChunks = await this.vectorStore.search(embeddingStr, 5);

    if (relevantChunks.length === 0) {
      return {
        answer: "I couldn't find relevant rules for that question in my knowledge base.",
        sources: [],
        confidence: 'low',
      };
    }

    const context = relevantChunks
      .map((c, i) => `[${i + 1}] ${c.section ?? ''} (${c.source}${c.page ? ` p.${c.page}` : ''})\n${c.content}`)
      .join('\n\n---\n\n');

    const response = await this.llm.chat([
      { role: 'system', content: RULES_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Rules context:\n\n${context}\n\n---\n\nQuestion: ${question}`,
      },
    ]);

    const avgScore = relevantChunks.reduce((sum, c) => sum + (c.score ?? 0), 0) / relevantChunks.length;
    const confidence: RagResult['confidence'] =
      avgScore > 0.8 ? 'high' : avgScore > 0.6 ? 'medium' : 'low';

    return {
      answer: response.content,
      sources: relevantChunks,
      confidence,
    };
  }
}
