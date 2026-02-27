import { Injectable } from '@nestjs/common';

@Injectable()
export class GeminiClient {
  private readonly apiKey = process.env.GEMINI_API_KEY || '';
  private readonly apiBase = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta';
  private readonly textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-1.5-flash';
  private readonly embeddingModel = process.env.GEMINI_EMBED_MODEL || 'text-embedding-004';
  private readonly timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 7000);
  private readonly cacheTtlMs = Number(process.env.GEMINI_CACHE_TTL_MS || 5 * 60 * 1000);
  private readonly textCache = new Map<string, { value: string; expiresAt: number }>();
  private readonly embeddingCache = new Map<string, { value: number[]; expiresAt: number }>();

  private readCache<T>(store: Map<string, { value: T; expiresAt: number }>, key: string): T | null {
    const item = store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      store.delete(key);
      return null;
    }
    return item.value;
  }

  private writeCache<T>(store: Map<string, { value: T; expiresAt: number }>, key: string, value: T) {
    store.set(key, { value, expiresAt: Date.now() + this.cacheTtlMs });
    if (store.size > 500) {
      const firstKey = store.keys().next().value;
      if (firstKey) {
        store.delete(firstKey);
      }
    }
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.apiBase}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Gemini request failed (${response.status}): ${details}`);
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text.trim()) return [];
    if (!this.apiKey) return [];
    const cacheKey = `${this.embeddingModel}:${text.trim().slice(0, 1000)}`;
    const cached = this.readCache(this.embeddingCache, cacheKey);
    if (cached) return cached;

    try {
      const payload = {
        model: `models/${this.embeddingModel}`,
        content: {
          parts: [{ text }]
        }
      };
      const data = await this.post<{ embedding?: { values?: number[] } }>(
        `/models/${this.embeddingModel}:embedContent?key=${encodeURIComponent(this.apiKey)}`,
        payload
      );
      const values = data.embedding?.values ?? [];
      this.writeCache(this.embeddingCache, cacheKey, values);
      return values;
    } catch {
      return [];
    }
  }

  async generateText(prompt: string): Promise<string> {
    if (!prompt.trim()) return '';
    if (!this.apiKey) return '';
    const cacheKey = `${this.textModel}:${prompt.trim().slice(0, 1200)}`;
    const cached = this.readCache(this.textCache, cacheKey);
    if (cached !== null) return cached;

    try {
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 220
        }
      };
      const data = await this.post<{
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      }>(`/models/${this.textModel}:generateContent?key=${encodeURIComponent(this.apiKey)}`, payload);
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim() ?? '';
      this.writeCache(this.textCache, cacheKey, text);
      return text;
    } catch {
      return '';
    }
  }
}
