import {
  createLocalJWKSet,
  createRemoteJWKSet,
  decodeJwt,
  jwtVerify,
  type JWK,
  type JWTVerifyOptions
} from 'jose';

export type JwtClaims = {
  sub: string;
  role?: string;
  email?: string;
  exp?: number;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

let remoteJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let localJwks: ReturnType<typeof createLocalJWKSet> | null = null;
let localJwksLoadedAt = 0;

async function loadLocalJwks() {
  const jwksUrl = process.env.SUPABASE_JWKS_URL || '';
  const apiKey = process.env.SUPABASE_JWKS_API_KEY || '';
  if (!jwksUrl || !apiKey) {
    throw new Error('SUPABASE_JWKS_URL and SUPABASE_JWKS_API_KEY are required');
  }
  if (localJwks && Date.now() - localJwksLoadedAt < 1000 * 60 * 60) {
    return localJwks;
  }
  const response = await fetch(jwksUrl, {
    headers: { apikey: apiKey }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch JWKS: ${response.status} ${text}`);
  }
  const json = (await response.json()) as { keys: JWK[] };
  localJwks = createLocalJWKSet(json);
  localJwksLoadedAt = Date.now();
  return localJwks;
}

function loadRemoteJwks() {
  const jwksUrl = process.env.SUPABASE_JWKS_URL || '';
  if (!jwksUrl) {
    throw new Error('SUPABASE_JWKS_URL is required');
  }
  if (!remoteJwks) {
    remoteJwks = createRemoteJWKSet(new URL(jwksUrl));
  }
  return remoteJwks;
}

export async function verifyJwt(token: string): Promise<JwtClaims> {
  if (process.env.SUPABASE_SKIP_JWT_VERIFY === 'true') {
    const payload = decodeJwt(token);
    if (!payload.sub) {
      throw new Error('JWT missing subject');
    }
    return {
      sub: String(payload.sub),
      role: typeof payload.role === 'string' ? payload.role : undefined,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
      app_metadata: (payload.app_metadata as Record<string, unknown> | undefined) ?? undefined,
      user_metadata: (payload.user_metadata as Record<string, unknown> | undefined) ?? undefined
    };
  }

  const options: JWTVerifyOptions = {};
  const issuer = process.env.SUPABASE_JWT_ISSUER || '';
  const audience = process.env.SUPABASE_JWT_AUD || '';
  if (issuer) options.issuer = issuer;
  if (audience) options.audience = audience;

  let payload;
  try {
    const jwks = process.env.SUPABASE_JWKS_API_KEY ? await loadLocalJwks() : loadRemoteJwks();
    ({ payload } = await jwtVerify(token, jwks, options));
  } catch (error) {
    if (options.issuer || options.audience) {
      const jwks = process.env.SUPABASE_JWKS_API_KEY ? await loadLocalJwks() : loadRemoteJwks();
      ({ payload } = await jwtVerify(token, jwks));
    } else {
      throw error;
    }
  }
  if (!payload.sub) {
    throw new Error('JWT missing subject');
  }
  return {
    sub: String(payload.sub),
    role: typeof payload.role === 'string' ? payload.role : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    app_metadata: (payload.app_metadata as Record<string, unknown> | undefined) ?? undefined,
    user_metadata: (payload.user_metadata as Record<string, unknown> | undefined) ?? undefined
  };
}
