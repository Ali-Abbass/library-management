type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
};

type SupabaseFilter = {
  column: string;
  operator: string;
  value: string | number | boolean;
};

export type SupabaseQuery = {
  select?: string;
  filters?: SupabaseFilter[];
  or?: string;
  order?: string;
  limit?: number;
  offset?: number;
};

let cachedConfig: SupabaseConfig | null = null;

function loadConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase configuration is missing');
  }
  return { url, serviceRoleKey };
}

function getConfig(): SupabaseConfig {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

function buildUrl(table: string, query?: SupabaseQuery): URL {
  const { url } = getConfig();
  const endpoint = new URL(`${url.replace(/\/$/, '')}/rest/v1/${table}`);
  const select = query?.select ?? '*';
  endpoint.searchParams.set('select', select);

  if (query?.or) {
    endpoint.searchParams.set('or', query.or);
  }

  query?.filters?.forEach((filter) => {
    const value = String(filter.value);
    endpoint.searchParams.append(filter.column, `${filter.operator}.${value}`);
  });

  if (query?.order) {
    endpoint.searchParams.set('order', query.order);
  }

  if (typeof query?.limit === 'number') {
    endpoint.searchParams.set('limit', `${query.limit}`);
  }

  if (typeof query?.offset === 'number') {
    endpoint.searchParams.set('offset', `${query.offset}`);
  }

  return endpoint;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  table: string,
  query?: SupabaseQuery,
  body?: unknown,
  options?: { single?: boolean }
): Promise<T> {
  const { serviceRoleKey } = getConfig();
  const url = buildUrl(table, query);
  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`
  };

  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    headers['Prefer'] = 'return=representation';
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as T;
  if (options?.single && Array.isArray(data)) {
    return (data[0] ?? null) as T;
  }
  return data;
}

export async function supabaseSelect<T>(table: string, query?: SupabaseQuery): Promise<T[]> {
  return request<T[]>('GET', table, query);
}

export async function supabaseSelectOne<T>(table: string, query?: SupabaseQuery): Promise<T | null> {
  const rows = await request<T[]>('GET', table, query);
  return rows[0] ?? null;
}

export async function supabaseInsert<T>(
  table: string,
  payload: unknown,
  options?: { single?: boolean }
): Promise<T> {
  return request<T>('POST', table, undefined, payload, options);
}

export async function supabaseUpdate<T>(
  table: string,
  payload: unknown,
  query: SupabaseQuery,
  options?: { single?: boolean }
): Promise<T> {
  return request<T>('PATCH', table, query, payload, options);
}

export async function supabaseDelete<T>(table: string, query: SupabaseQuery): Promise<T> {
  return request<T>('DELETE', table, query);
}
