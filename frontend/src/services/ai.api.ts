import { apiRequest } from './http';

type SemanticResult = { query: string; results: Array<{ id: string; title?: string; code?: string; score: number }> };
type QuerySuggestion = { original: string; suggested: string; reasons: string[] };

type SimilarBook = { id: string; title?: string; code?: string; reason: string };

type ReadingTime = { minutes: number } | null;

type GenreTrend = { genre: string; score: number };
export type PatronRecommendation = {
  id: string;
  title?: string;
  code?: string;
  reason: string;
  confidence: number;
};

export type PatronRecommendationsResponse = {
  mode: 'personalized' | 'starter';
  generatedAt: string;
  items: PatronRecommendation[];
};

export function semanticSearch(query: string) {
  return apiRequest<SemanticResult>('/search/semantic', { method: 'POST', body: { query } });
}

export function suggestSemanticQuery(query: string) {
  return apiRequest<QuerySuggestion>('/ai/suggest-query', { method: 'POST', body: { query } });
}

export function fetchSimilar(bookId: string) {
  return apiRequest<SimilarBook[]>(`/ai/similar/${bookId}`);
}

export function fetchReadingTime(bookId: string) {
  return apiRequest<ReadingTime>(`/ai/reading-time/${bookId}`);
}

export function fetchGenreTrends() {
  return apiRequest<GenreTrend[]>('/ai/genre-trends');
}

export function fetchPatronRecommendations(refresh = false) {
  const query = refresh ? '?refresh=true' : '';
  return apiRequest<PatronRecommendationsResponse>(`/ai/recommendations${query}`);
}
