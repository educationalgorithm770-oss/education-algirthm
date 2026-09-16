import { NextRequest, NextResponse } from 'next/server';
import pdfBank from '@/data/pdf-interview-bank.json';
import { callGeminiWithRotation } from '@/lib/gemini';
import { getSessionFromRequest } from '@/lib/auth';

export interface RAGInterviewQuestion {
  id: string;
  title: string;
  prompt: string;
  category: string;
  company: string;
  difficulty: string;
  canonicalRubric: string[];
  idealSolution: string;
}

// FAANG System Design & DSA High-Yield Scenarios
const FAANG_SCENARIOS: RAGInterviewQuestion[] = [
  {
    id: 'rag_sd_google_1',
    title: 'High-Throughput Distributed Payment Engine',
    company: 'Google / Stripe',
    difficulty: 'HARD',
    category: 'System Design',
    prompt: 'Architect a Payment Gateway processing 50,000 requests/sec with idempotency, HMAC signature validation, distributed locking, and zero double-charge guarantee during database failover. How do you handle duplicate webhooks?',
    canonicalRubric: [
      'Idempotency Key lookup in Redis with 24-hour TTL before processing',
      'HMAC SHA-256 webhook payload signature verification',
      'Distributed lock (Redlock / Atomic Redis SETNX) during transaction commit',
      'Kafka Dead-Letter Queue (DLQ) for failed payment retry backoff',
      'PostgreSQL database optimistic locking using @Version column'
    ],
    idealSolution: `Staff Engineer Solution Architecture:
1. API Gateway validates client HMAC signature and checks Redis for the "X-Idempotency-Key".
2. If key exists in Redis, return cached transaction result immediately to prevent duplicate charges.
3. If new request, acquire Redlock on user account, publish payment intent to Kafka topic, and process via worker fleet.
4. Worker executes DB transaction with optimistic locking (@Version). Upon success, cache response in Redis (24h TTL) and publish event to webhook dispatcher.`
  },
  {
    id: 'rag_sd_amazon_2',
    title: 'Multi-Region Distributed API Rate Limiter',
    company: 'Amazon / Cloudflare',
    difficulty: 'HARD',
    category: 'System Design',
    prompt: 'Design a distributed rate limiter for API endpoints across 3 geographic regions (US East, EU West, AP South). Which algorithm would you choose and how do you sync counter state between Redis clusters with sub-5ms latency?',
    canonicalRubric: [
      'Sliding Window Counter or Token Bucket Algorithm selection',
      'Redis Cluster multi-region async replication with Lua atomic scripts',
      'Local in-memory L1 cache (Caffeine / Guava) to reduce Redis roundtrips',
      'Graceful degradation / fallback mode during Redis cluster partition',
      'Http 429 Too Many Requests response with Retry-After header'
    ],
    idealSolution: `Staff Engineer Solution Architecture:
1. Use Sliding Window Counter algorithm implemented via Redis Lua scripts (atomic ZADD + ZREMRANGEBYSCORE).
2. L1 Local Memory Cache handles 90% of token checks locally; L2 Redis Cluster handles cross-region quota sync.
3. If rate limit exceeded, return HTTP 429 status code with "Retry-After" and "X-RateLimit-Reset" headers.`
  },
  {
    id: 'rag_dsa_meta_1',
    title: 'LRU Cache with O(1) Operations & Memory Safety',
    company: 'Meta / Apple',
    difficulty: 'MEDIUM',
    category: 'DSA & Algorithms',
    prompt: 'Design a Least Recently Used (LRU) Cache supporting O(1) get(key) and O(1) put(key, value) operations. Detail how Doubly LinkedList combined with HashMap prevents memory fragmentation and handles eviction at capacity.',
    canonicalRubric: [
      'HashMap<Key, Node> for O(1) node pointer lookup',
      'Doubly LinkedList with dummy Head and Tail nodes for O(1) deletion and insertion',
      'Move accessed node to Head on get() and put()',
      'Evict Tail.prev node when capacity is exceeded',
      'Explicit O(1) time complexity and O(N) space complexity analysis'
    ],
    idealSolution: `Staff Engineer Solution:
- HashMap provides O(1) pointer access.
- Doubly LinkedList supports O(1) node unlinking and re-attaching at head.
- Eviction deletes node right before dummy tail: 'removeNode(tail.prev); map.remove(key);'`
  }
];

import { checkAiRateLimit } from '@/lib/aiRateLimiter';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Authentication required to access AI Mock Interviews.' }, { status: 401 });
    }

    const rateCheck = checkAiRateLimit(req, session.email || (session as any).id || (session as any).sub || 'unknown', true);
    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }

    const body = await req.json();
    const action = body.action || (body.responseText ? 'evaluate' : 'generate_question');
    const difficulty = (body.difficulty || 'all').toLowerCase(); // 'easy', 'medium', 'hard', 'all'
    const track = (body.track || 'java_fullstack') as string;
    const apiKey = process.env.GEMINI_API_KEY;

    if (['generate_question', 'question', 'generate', 'new_question'].includes(action) || !body.responseText) {
      return await handleRAGGenerateQuestion(difficulty, track, apiKey);
    } else {
      const { questionTitle, questionPrompt, responseText } = body;
      return await handleRAGEvaluateResponse(track, questionTitle, questionPrompt, responseText, apiKey);
    }
  } catch (error: unknown) {
    console.error('[/api/ai/interview]', error);
    return NextResponse.json({ success: false, message: 'RAG Interview processing error' }, { status: 500 });
  }
}

import fs from 'fs';
import path from 'path';

const STORE_PATH = path.join(process.cwd(), 'src/data/rag-knowledge-store.json');

function getDynamicInterviewQuestions(): any[] {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, 'utf-8');
      const store = JSON.parse(data);
      if (Array.isArray(store.documents)) {
        return store.documents.map((d: any) => ({
          id: d.id,
          title: d.title,
          prompt: d.problemStatement || d.title,
          category: d.category || 'Technical',
          company: d.companyTags?.join(', ') || 'FAANG',
          difficulty: (d.difficulty || 'MEDIUM').toUpperCase(),
          canonicalRubric: d.canonicalRubric || ['Accurate technical explanation', 'Production trade-offs'],
          idealSolution: d.canonicalSolution || d.content || '',
        }));
      }
    }
  } catch (err) {
    console.error('Error reading dynamic interview questions:', err);
  }
  return [];
}

async function handleRAGGenerateQuestion(difficulty: string, track: string, apiKey?: string) {
  const dynamicItems = getDynamicInterviewQuestions();
  let pool: any[] = dynamicItems;

  if (difficulty !== 'all') {
    const filtered = pool.filter(p => p.difficulty.toLowerCase() === difficulty.toLowerCase());
    if (filtered.length > 0) pool = filtered;
  }

  if (pool.length === 0) pool = FAANG_SCENARIOS;

  const randomIndex = Math.floor(Math.random() * pool.length);
  const selected = pool[randomIndex];

  const questionObj: RAGInterviewQuestion = {
    id: selected.id || `q_${Date.now()}`,
    title: selected.title,
    prompt: selected.prompt || `Explain the concept: ${selected.title}`,
    category: selected.topic || selected.category || 'Java Full Stack',
    company: selected.company || '50,000 Questions PDF Bank',
    difficulty: selected.level || selected.difficulty || difficulty.toUpperCase(),
    canonicalRubric: selected.canonicalRubric || [
      `Accurate technical explanation of ${selected.title.slice(0, 30)}`,
      'Production trade-offs, practical examples, and memory implications',
      'Edge cases, memory efficiency, and fault tolerance'
    ],
    idealSolution: selected.canonicalAnswer || selected.idealSolution || 'Reference Staff Engineer architecture.'
  };

  return NextResponse.json({
    success: true,
    question: questionObj
  });
}

function isGibberish(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 15) return true;
  if (/(.)\1{4,}/.test(trimmed)) return true;
  if (/qwerty|asdfgh|zxcvbn|123456/i.test(trimmed)) return true;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 4) return true;
  return false;
}

async function handleRAGEvaluateResponse(
  track: string,
  questionTitle?: string,
  questionPrompt?: string,
  responseText?: string,
  apiKey?: string
) {
  const text = (responseText || '').trim();
  const title = questionTitle || 'Java Full Stack Technical Question';
  const promptStr = questionPrompt || title;

  if (!text) {
    return NextResponse.json({ success: false, message: 'Response text required.' }, { status: 400 });
  }

  if (isGibberish(text)) {
    return NextResponse.json({
      success: true,
      scorecard: {
        track,
        overallScore: 12,
        technicalAccuracy: 10,
        systemDesign: 10,
        codeQuality: 10,
        communication: 15,
        timeComplexity: 15,
        verdict: 'REJECT (Incoherent / Gibberish Input)',
        strengths: ['No technical strengths identified.'],
        improvementAreas: ['Provide a valid engineering answer with technical architecture details.'],
        rubricChecklist: [],
        canonicalSolution: 'N/A'
      }
    });
  }

  // Find matching question in PDF bank or FAANG scenarios to retrieve canonical reference answer
  let matchedQuestion: any = FAANG_SCENARIOS.find(q => q.title.toLowerCase().includes(title.toLowerCase()));
  if (!matchedQuestion && pdfBank.hard) {
    matchedQuestion = pdfBank.hard.find((q: any) => q.title.toLowerCase().includes(title.toLowerCase()))
      || pdfBank.medium.find((q: any) => q.title.toLowerCase().includes(title.toLowerCase()))
      || pdfBank.easy.find((q: any) => q.title.toLowerCase().includes(title.toLowerCase()));
  }

  const canonicalAnswer = matchedQuestion?.canonicalAnswer || matchedQuestion?.idealSolution || 'Core technical concept explanation.';
  const companyTag = matchedQuestion?.company || '50,000 Questions PDF Bank';

  // 1. LIVE GEMINI EVALUATION ENGINE (Using multi-key load balanced Gemini 3.5 Flash)
  try {
    const evaluationPrompt = `You are a Principal Software Engineering Evaluator at FAANG (Google, Meta, Amazon).
Question: "${promptStr}"
Canonical PDF Reference Answer: "${canonicalAnswer}"
Candidate's Actual Answer:
"""
${text}
"""

Instructions:
Evaluate the candidate's answer carefully. Be fair, precise, and intellectually rigorous.
1. If the candidate gives a correct, well-reasoned answer explaining the core concept (with examples and mechanics), award a high score (80-98/100).
2. If the candidate gives a partial answer, award a balanced score (60-78/100).
3. If the candidate gives incorrect or off-topic information, award a low score (20-45/100).
4. Extract 3 specific rubric requirements and evaluate if the candidate satisfied them.
5. Provide specific, tailored strengths quoting their answer, and real constructive improvement areas.

Return ONLY valid JSON matching this exact structure without markdown backticks:
{
  "overallScore": number (0-100),
  "technicalAccuracy": number (0-100),
  "systemDesign": number (0-100),
  "codeQuality": number (0-100),
  "communication": number (0-100),
  "timeComplexity": number (0-100),
  "verdict": "STRONG HIRE (FAANG Level)" | "HIRE (Solid Competency)" | "LEAN HIRE (SDE 1 Level)" | "NEUTRAL (Partial Answer)" | "REJECT (Incorrect/Incoherent)",
  "rubricChecklist": [
     { "requirement": "Specific Concept 1", "met": boolean },
     { "requirement": "Specific Concept 2", "met": boolean },
     { "requirement": "Specific Concept 3", "met": boolean }
  ],
  "strengths": ["Specific strength 1 based on candidate answer", "Specific strength 2"],
  "improvementAreas": ["Specific actionable improvement area 1", "Specific actionable improvement area 2"]
}`;

    const geminiResult = await callGeminiWithRotation({
      contents: evaluationPrompt,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(geminiResult.text);
    if (typeof parsed?.overallScore === 'number' && parsed?.verdict) {
      const metCount = parsed.rubricChecklist?.filter((r: any) => r.met)?.length || 0;
      const totalCount = parsed.rubricChecklist?.length || 1;
      const rubricMatchPercentage = Math.round((metCount / totalCount) * 100);

      return NextResponse.json({
        success: true,
        scorecard: {
          track,
          overallScore: parsed.overallScore,
          technicalAccuracy: parsed.technicalAccuracy || parsed.overallScore,
          systemDesign: parsed.systemDesign || parsed.overallScore,
          codeQuality: parsed.codeQuality || parsed.overallScore,
          communication: parsed.communication || parsed.overallScore,
          timeComplexity: parsed.timeComplexity || parsed.overallScore,
          verdict: parsed.verdict,
          strengths: parsed.strengths || ['Good technical response.'],
          improvementAreas: parsed.improvementAreas || ['Expand on production edge cases.'],
          companyTag,
          rubricMatchPercentage,
          rubricChecklist: parsed.rubricChecklist || [],
          canonicalSolution: canonicalAnswer
        }
      });
    }
  } catch (e) {
    console.warn('[/api/ai/interview] Gemini API evaluation error across key pool, using fallback:', e);
  }

  // 2. SMART FALLBACK EVALUATION (When API is offline)
  const lowerText = text.toLowerCase();
  const canonicalWords = canonicalAnswer.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const matchedCanonicalWords = canonicalWords.filter((cw: string) => lowerText.includes(cw));
  const canonicalCoverageRatio = canonicalWords.length ? matchedCanonicalWords.length / canonicalWords.length : 0.5;

  const rubricChecklist = [
    {
      requirement: `Accurate definition and core mechanics of ${title.slice(0, 35)}`,
      met: lowerText.length > 25 && matchedCanonicalWords.length >= 2
    },
    {
      requirement: 'Practical architectural example or concrete code scenario',
      met: lowerText.includes('for example') || lowerText.includes('e.g.') || lowerText.includes('class') || lowerText.includes('node') || lowerText.includes('instance')
    },
    {
      requirement: 'Relationship to outer scope, memory lifecycle, or concurrency',
      met: lowerText.includes('static') || lowerText.includes('outer') || lowerText.includes('reference') || lowerText.includes('memory') || lowerText.includes('thread')
    }
  ];

  const metCount = rubricChecklist.filter(r => r.met).length;
  const rubricMatchRatio = metCount / rubricChecklist.length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const baseScore = Math.round(canonicalCoverageRatio * 50) + Math.round(rubricMatchRatio * 40) + Math.min(Math.floor(wordCount / 5), 10);
  const overallScore = Math.min(Math.max(baseScore, 35), 96);

  let verdict = 'REJECT (Insufficient Coverage)';
  if (overallScore >= 88) verdict = 'STRONG HIRE (FAANG Level)';
  else if (overallScore >= 78) verdict = 'HIRE (Solid SDE Competency)';
  else if (overallScore >= 65) verdict = 'LEAN HIRE (SDE 1 Level)';
  else if (overallScore >= 50) verdict = 'NEUTRAL (Partial Answer)';

  return NextResponse.json({
    success: true,
    scorecard: {
      track,
      overallScore,
      technicalAccuracy: Math.min(overallScore + 2, 98),
      systemDesign: Math.min(overallScore + 1, 98),
      codeQuality: Math.min(overallScore + 3, 95),
      communication: Math.min(overallScore + 4, 96),
      timeComplexity: Math.min(overallScore, 98),
      verdict,
      strengths: [
        `Accurately addressed core concepts from canonical reference (${Math.round(canonicalCoverageRatio * 100)}% keyword alignment).`,
        `Provided structured explanation with ${wordCount} words detailing technical behavior.`
      ],
      improvementAreas: [
        'Could elaborate further on memory footprint and lifecycle management.',
        'Include edge cases and potential runtime exception risks.'
      ],
      companyTag,
      rubricMatchPercentage: Math.round(rubricMatchRatio * 100),
      rubricChecklist,
      canonicalSolution: canonicalAnswer
    }
  });
}
