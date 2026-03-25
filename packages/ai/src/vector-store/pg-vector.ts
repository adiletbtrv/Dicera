import pg from 'pg';
import type { VectorStore, RagChunk } from '../types.js';

export class PgVectorStore implements VectorStore {
    private pool: pg.Pool;

    constructor(connectionString: string) {
        this.pool = new pg.Pool({ connectionString });
    }

    async upsert(chunks: RagChunk[]): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            for (const chunk of chunks) {
                const embeddingStr = chunk.embedding ? `[${chunk.embedding.join(',')}]` : null;
                await client.query(
                    `INSERT INTO rag_chunks (id, content, source, page, section, embedding)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             content = EXCLUDED.content,
             source = EXCLUDED.source,
             page = EXCLUDED.page,
             section = EXCLUDED.section,
             embedding = EXCLUDED.embedding`,
                    [chunk.id, chunk.content, chunk.source, chunk.page, chunk.section, embeddingStr]
                );
            }
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async search(query: string, topK: number = 5): Promise<RagChunk[]> {
        const res = await this.pool.query(
            `SELECT id, content, source, page, section,
              1 - (embedding <=> $1) as score
       FROM rag_chunks
       ORDER BY embedding <=> $1
       LIMIT $2`,
            [query, topK]
        );
        return res.rows;
    }

    async delete(ids: string[]): Promise<void> {
        await this.pool.query(`DELETE FROM rag_chunks WHERE id = ANY($1)`, [ids]);
    }
}
