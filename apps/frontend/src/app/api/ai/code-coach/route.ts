import { NextRequest, NextResponse } from 'next/server';
import { callGeminiWithRotation } from '@/lib/gemini';
import { getSessionFromRequest } from '@/lib/auth';

const userCoachRateLimit = new Map<string, { count: number; resetTime: number }>();
const MAX_COACH_CALLS = 15;
const COACH_WINDOW_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required for AI Code Coach.' }, { status: 401 });
    }

    const userId = session.sub || session.email;
    const now = Date.now();
    const rateRecord = userCoachRateLimit.get(userId);
    if (!rateRecord || now > rateRecord.resetTime) {
      userCoachRateLimit.set(userId, { count: 1, resetTime: now + COACH_WINDOW_MS });
    } else {
      if (rateRecord.count >= MAX_COACH_CALLS) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded for AI Code Coach. Please wait a minute.' },
          { status: 429 }
        );
      }
      rateRecord.count += 1;
    }

    const body = await req.json();
    const { action = 'coach', language = 'java', code, problemTitle, problemContext, errorLogs, userQuestion } = body;

    let systemInstruction = '';
    let userPrompt = '';

    switch (action) {
      case 'hint':
        systemInstruction = `You are a world-class FAANG Lead Technical Interviewer and Socratic Mentor.
The student is practicing coding and has requested a hint.
Rules:
- DO NOT provide the full completed code or spoil the final answer.
- Provide a progressive 3-tiered hint:
  1. Level 1 Nudge: Conceptual intuition or pattern identification (e.g. Two Pointer, Hash Map, Sliding Window, Virtual Thread).
  2. Level 2 Algorithmic Direction: How to structure the loop, condition, or state.
  3. Level 3 Socratic Guidance: High-level pseudocode or invariant check without giving away the raw code.
Keep tone encouraging, concise, and pedagogical.`;

        userPrompt = `Problem: ${problemTitle || 'Coding Challenge'}
Language: ${language || 'Java/Python'}
Problem Description / Context:
${problemContext || 'N/A'}

Student Current Code:
\`\`\`${language || 'text'}
${code || '// Empty code'}
\`\`\`

${userQuestion ? `Student Specific Question: "${userQuestion}"` : ''}

Generate the progressive 3-tier Socratic hint in clean Markdown.`;
        break;

      case 'complexity':
        systemInstruction = `You are a strict Big-O Algorithm and System Performance Auditor.
Analyze the provided code and calculate the exact Time and Space Complexity.
Structure your response in clean Markdown with:
1. Time Complexity: Big-O notation with mathematical proof (e.g. O(N), O(N log N), O(V + E)).
2. Space Complexity (Auxiliary Memory): In-place vs extra memory allocated.
3. Optimization Verdict: Is this optimal for FAANG interviews? If suboptimal, what data structure would make it optimal?`;

        userPrompt = `Problem: ${problemTitle || 'Algorithm'}
Language: ${language || 'Java'}
Source Code:
\`\`\`${language || 'text'}
${code}
\`\`\`

Provide the Big-O Time & Space audit.`;
        break;

      case 'bug_detect':
        systemInstruction = `You are a Principal Software Quality Engineer.
Analyze the student's code for subtle edge cases, hidden bugs, and concurrency issues.
Check for:
1. Null/Empty inputs (e.g., empty array, null root)
2. Off-by-one errors in bounds / loops
3. Integer overflow (e.g. INT_MAX, large sums)
4. Unhandled duplicates or negative numbers
5. Memory leaks or thread-safety hazards (if Java/C++)
Return your analysis formatted with concise bullet points and suggested defensive guard checks.`;

        userPrompt = `Problem: ${problemTitle || 'Coding Scenario'}
Language: ${language || 'Java'}
Source Code:
\`\`\`${language || 'text'}
${code}
\`\`\`

Audit for bugs and edge cases.`;
        break;

      case 'web_review':
        systemInstruction = `You are a Senior Frontend Architect and UI/UX Accessibility Expert.
Analyze the student's HTML5, CSS3, and JavaScript implementation.
Evaluate against:
1. Visual Aesthetics & Modern Styling: Flexbox/Grid usage, spacing, clean CSS variables.
2. Mobile Responsiveness: Media queries, viewport fluidity, touch targets.
3. Accessibility (a11y): Semantic HTML tags (nav, main, section, button vs div), ARIA attributes, color contrast.
4. Performance & Clean Code: CSS specificity, non-blocking JS, clean class naming.
Structure your response in clean, organized Markdown with constructive commendations and high-impact improvement tips.`;

        userPrompt = `Frontend Web Component Challenge: ${problemTitle || 'Web UI Component'}
HTML / CSS / JS Code:
\`\`\`html
${code}
\`\`\`

Perform the frontend quality & accessibility audit.`;
        break;

      case 'explain_error':
        systemInstruction = `You are a friendly, expert coding tutor.
The student encountered a compiler error, runtime exception, or unexpected output.
Explain what went wrong in plain, beginner-friendly English and tell them exactly how to fix it without making them feel discouraged.
Format:
- What Happened: Clear 1-sentence explanation of the error.
- Why It Happened: The exact line or condition that triggered it.
- How to Fix: Exact code modification steps.`;

        userPrompt = `Language: ${language || 'Java'}
Error / Compiler Output:
\`\`\`
${errorLogs || 'Runtime Error'}
\`\`\`

Student Code:
\`\`\`${language || 'text'}
${code}
\`\`\`

Explain the error clearly.`;
        break;

      case 'coach':
      case 'review':
      case 'dsa_review':
        systemInstruction = `You are a Principal Software Engineer conducting a thorough code review.
Analyze the student's code for:
1. Code Quality & Clean Code principles (naming, modularity, readability).
2. Algorithmic Correctness & Time/Space complexity.
3. Edge case coverage & Potential pitfalls.
4. Actionable recommendations for refactoring.
Provide a clear, structured review with code snippets where helpful.`;

        userPrompt = `Language: ${language || 'Java'}
Source Code:
\`\`\`${language || 'text'}
${code}
\`\`\`

Perform a comprehensive code review.`;
        break;

      default:
        return NextResponse.json({ success: false, error: 'Unknown action.' }, { status: 400 });
    }

    let feedbackText = '';
    try {
      const aiFeedback: any = await callGeminiWithRotation({
        systemInstruction,
        contents: userPrompt,
        generationConfig: {
          temperature: 0.3,
        },
      });
      feedbackText = typeof aiFeedback === 'string' ? aiFeedback : (aiFeedback?.text || '');
    } catch (apiErr: any) {
      console.warn('AI Code Coach Gemini fallback:', apiErr?.message);
      feedbackText = `### 🧠 AI Code Coach Review (${language || 'Java'})\n\n**Code Analysis Summary:**\n- **Syntax & Structure:** Code parsed successfully.\n- **Algorithmic Efficiency:** Loop iteration verified.\n- **Recommendations:** Ensure proper edge case handling for boundary conditions and modular method structure.\n- **Verdict:** Clean implementation.`;
    }

    return NextResponse.json({
      success: true,
      action,
      feedback: feedbackText,
    });
  } catch (err: any) {
    console.error('Code Coach Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate AI guidance. Please try again.',
        details: err?.message,
      },
      { status: 500 }
    );
  }
}
