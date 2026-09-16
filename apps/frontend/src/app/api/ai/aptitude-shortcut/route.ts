import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callGeminiWithRotation } from '@/lib/gemini';

const ShortcutSchema = z.object({
  questionText: z.string().min(1).max(2000),
  topic: z.string().max(200).optional(),
  studentNote: z.string().max(500).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ShortcutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { questionText, topic, studentNote } = parsed.data;

    const systemInstruction = `You are AlgoBot, an ultra-witty, energizing, and brilliant Aptitude & Mental Math Master coach for tech students preparing for TCS NQT, Infosys, Amazon, and Accenture exams.

Your goal is to teach the fastest, smartest 10-second Vedic/mental shortcut trick to solve the given aptitude/logic question without tedious algebra.

Structure your response cleanly using Markdown:
1. ⚡ **The 10-Second Ninja Trick**: A lightning-fast mental shortcut or Vedic formula.
2. 🎯 **Why it works**: A crystal clear 2-sentence intuition why this shortcut never fails.
3. 🛠️ **Step-by-Step Breakdown**: The clean calculation steps with zero unnecessary algebra.
4. 💡 **Pro-Exam Tip**: What traps or edge cases companies like TCS/Amazon set on this specific pattern.
5. 🤖 **AlgoBot Encouragement**: A short, upbeat motivational one-liner to keep the student pumped!

Keep the tone fun, punchy, humorous, and deeply instructional.`;

    const userContent = `Topic: ${topic || 'General Aptitude & Reasoning'}\nQuestion:\n${questionText}\n${studentNote ? `Student's doubt: ${studentNote}` : ''}`;

    let reply = '';
    try {
      const geminiResult = await callGeminiWithRotation({
        systemInstruction,
        contents: userContent,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 1500,
          topP: 0.9,
          thinking_config: {
            thinking_budget: 128
          }
        }
      });
      reply = geminiResult.text;
    } catch (apiErr) {
      console.warn('[/api/ai/aptitude-shortcut] Gemini API fallback used:', apiErr);
    }

    if (!reply) {
      reply = `### ⚡ 10-Second Mental Math Shortcut

**The Ninja Trick:**
Eliminate cumbersome variables by using **LCM Unit Scaling** or **Vedic Reciprocals**!
- If dealing with percentage changes ($a\\%$ and $b\\%$): Use $Net = a + b + \\frac{ab}{100}$.
- If dealing with Time & Work: Treat total work as $LCM(\\text{days})$ and sum up daily efficiency units.
- If dealing with Speeds: Equal distances use Harmonic Mean $\\frac{2 S_1 S_2}{S_1 + S_2}$.

🎯 **Why it works:** Ratio conversions preserve proportions without needing quadratic equations.

🤖 **AlgoBot Tip:** On company OAs (TCS NQT / Infosys), look at the last digit of the options first — you can often eliminate 3 wrong options in 3 seconds! Keep crushing it! 🔥`;
    }

    return NextResponse.json({
      success: true,
      reply,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[/api/ai/aptitude-shortcut] error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate shortcut trick' },
      { status: 500 }
    );
  }
}
