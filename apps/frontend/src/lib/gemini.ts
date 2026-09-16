/**
 * Google Gemini Multi-Key Load Balancer & Auto-Failover Pool
 * Supports pooling multiple Gemini API keys with automatic failover and load balancing.
 */

const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest'
];

let currentKeyIndex = 0;

// Track temporarily exhausted / rate-limited / invalid keys with cooldown timestamps
const keyCooldowns = new Map<string, number>();
const COOLDOWN_DURATION_MS = 30 * 1000; // 30 seconds cooldown for rate limits
const AUTH_ERROR_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown for invalid keys

const DEFAULT_FALLBACK_KEYS: string[] = [];

/**
 * Extracts and cleans all configured Gemini API keys from environment variables.
 */
export function getGeminiApiKeys(): string[] {
  const keys: string[] = [];

  const rawKeys = [
    process.env.GEMINI_API_KEY,
    process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    ...(process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(/[,;\n\r]+/) : [])
  ];

  for (const r of rawKeys) {
    if (!r) continue;
    const trimmed = r.trim();
    if (trimmed.length > 10 && !keys.includes(trimmed)) {
      keys.push(trimmed);
    }
  }

  return keys;
}

export interface GeminiContentPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiContentItem {
  role?: 'user' | 'model';
  parts: GeminiContentPart[];
}

export interface GeminiRequestOptions {
  systemInstruction?: string;
  contents: GeminiContentItem[] | string;
  timeoutMs?: number;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
    responseMimeType?: string;
    response_mime_type?: string;
    thinkingConfig?: {
      thinkingBudget?: number;
    };
    thinking_config?: {
      thinking_budget?: number;
    };
  };
}

export interface GeminiResponseResult {
  text: string;
  keyUsedIndex: number;
  totalKeys: number;
}

/**
 * Executes a Gemini Flash generation request with automatic multi-key load balancing, timeout handling, and instant failover.
 */
export async function callGeminiWithRotation(
  options: GeminiRequestOptions
): Promise<GeminiResponseResult> {
  const allKeys = getGeminiApiKeys();

  const payloadContents =
    typeof options.contents === 'string'
      ? [{ role: 'user', parts: [{ text: options.contents }] }]
      : options.contents;

  const requestBody: Record<string, any> = {
    contents: payloadContents,
  };

  if (options.systemInstruction) {
    requestBody.system_instruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  if (options.generationConfig) {
    requestBody.generationConfig = {
      maxOutputTokens: 8192,
      ...options.generationConfig,
    };
  }

  const timeoutMs = options.timeoutMs || 15000;
  const totalKeys = allKeys.length;
  const now = Date.now();
  const startIndex = currentKeyIndex;
  let lastError: any = null;

  for (const modelName of GEMINI_MODELS) {
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    for (let attempt = 0; attempt < totalKeys; attempt++) {
      const keyIdx = (startIndex + attempt) % totalKeys;
      const apiKey = allKeys[keyIdx];

      const cooldownUntil = keyCooldowns.get(apiKey);
      if (cooldownUntil && now < cooldownUntil) {
        continue;
      }

      try {
        const response = await fetch(`${baseUrl}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (response.ok) {
          const data = await response.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          const text = parts.map((p: any) => p.text || '').filter(Boolean).join('\n');

          if (text) {
            currentKeyIndex = (keyIdx + 1) % totalKeys;
            return {
              text,
              keyUsedIndex: keyIdx + 1,
              totalKeys,
            };
          }
        }

        const isAuthError = response.status === 401 || response.status === 403;
        keyCooldowns.set(apiKey, now + (isAuthError ? AUTH_ERROR_COOLDOWN_MS : COOLDOWN_DURATION_MS));
        const errorText = await response.text();
        lastError = new Error(`HTTP ${response.status} on model ${modelName}: ${errorText.substring(0, 120)}`);
      } catch (fetchErr: any) {
        lastError = fetchErr;
      }
    }
  }

  throw new Error(
    `All Gemini API attempts completed. Last error: ${lastError?.message || 'Timeout'}`
  );
}
