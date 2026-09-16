import { NextRequest, NextResponse } from 'next/server';

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

// Clean up stale buckets every 15 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((bucket, key) => {
      if (now - bucket.lastRefill > 60 * 60 * 1000) {
        rateLimitStore.delete(key);
      }
    });
  }, 15 * 60 * 1000);
}

export interface RateLimitConfig {
  maxTokens: number;
  refillRatePerSec: number;
}

const AUTH_CONFIG: RateLimitConfig = {
  maxTokens: 60,
  refillRatePerSec: 0.1,
};

const PUBLIC_CONFIG: RateLimitConfig = {
  maxTokens: 15,
  refillRatePerSec: 0.025,
};

export function checkAiRateLimit(
  req: NextRequest,
  customIdentifier?: string,
  isAuthenticated: boolean = false
): { allowed: boolean; remaining: number; retryAfterSec: number; response?: NextResponse } {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const key = customIdentifier ? `user:${customIdentifier}` : `ip:${ip}`;
  const config = isAuthenticated ? AUTH_CONFIG : PUBLIC_CONFIG;
  const now = Date.now();

  let bucket = rateLimitStore.get(key);
  if (!bucket) {
    bucket = { tokens: config.maxTokens, lastRefill: now };
    rateLimitStore.set(key, bucket);
  }

  const elapsedSec = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(config.maxTokens, bucket.tokens + elapsedSec * config.refillRatePerSec);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      retryAfterSec: 0,
    };
  }

  const missingTokens = 1 - bucket.tokens;
  const retryAfterSec = Math.ceil(missingTokens / config.refillRatePerSec);

  const response = NextResponse.json(
    {
      success: false,
      error: 'AI Rate Limit Exceeded',
      message: `You have reached your AI request limit. Please wait ${retryAfterSec} seconds before sending another message.`,
      retryAfter: retryAfterSec,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Limit': String(config.maxTokens),
        'X-RateLimit-Remaining': '0',
      },
    }
  );

  return {
    allowed: false,
    remaining: 0,
    retryAfterSec,
    response,
  };
}
