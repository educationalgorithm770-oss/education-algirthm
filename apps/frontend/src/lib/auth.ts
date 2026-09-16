import { SignJWT }    from 'jose/jwt/sign';
import { jwtVerify }  from 'jose/jwt/verify';
import { cookies }    from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable must be set in production mode.');
    }
    return new TextEncoder().encode('ea_dev_secret_change_in_production_2026');
  }
  return new TextEncoder().encode(secret);
}

const JWT_SECRET = getJwtSecret();

const COOKIE_NAME = 'ea_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface JWTPayload {
  sub: string;        // student id as string
  name: string;
  email: string;
  role: 'student' | 'admin' | 'instructor';
  iat?: number;
  exp?: number;
}

// ─── Sign ────────────────────────────────────────────────────────────────────

export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

// ─── Verify ───────────────────────────────────────────────────────────────────

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

/** Set the JWT as an httpOnly, SameSite=Lax cookie on a response */
export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  // Only use secure cookies if explicitly enabled via COOKIE_SECURE=true in HTTPS production
  const isSecure = process.env.COOKIE_SECURE === 'true';
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  return response;
}

/** Clear the auth cookie */
export function clearAuthCookie(response: NextResponse): NextResponse {
  const isSecure = process.env.COOKIE_SECURE === 'true';
  const options = {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
  response.cookies.set(COOKIE_NAME, '', options);
  response.cookies.set('ea_session', '', options);
  return response;
}

/** Read and verify the JWT from the incoming request's cookie or Authorization header */
export async function getSessionFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  let token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }
  if (!token) return null;
  return verifyToken(token);
}

/** Read and verify the JWT from the current server component context */
export async function getSession(): Promise<JWTPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
