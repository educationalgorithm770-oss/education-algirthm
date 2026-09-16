import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callGeminiWithRotation } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

const SocraticHintSchema = z.object({
  questionText: z.string().min(1).max(2000),
  topicTitle: z.string().max(200).optional(),
  hintLevel: z.number().int().min(1).max(3).default(1) // 1 = Intuition Spark, 2 = Formula Anchor, 3 = Full Step Eureka
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SocraticHintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { questionText, topicTitle, hintLevel } = parsed.data;

    const levelDescriptions = {
      1: 'Level 1 (Intuition Spark): Give a 1-sentence thought-provoking clue or visual metaphor. DO NOT reveal the final formula or answer.',
      2: 'Level 2 (Formula Anchor): Give the exact mental shortcut formula or proportionality trick. Guide them to the next algebraic step.',
      3: 'Level 3 (Full Visual Eureka): Give the complete 10-second mental step-by-step breakdown and reveal the correct intuition.'
    };

    const systemInstruction = `You are AlgoBot, an empathetic, witty, and master Aptitude coach.
Your job is to provide Socratic hints to help students solve aptitude and reasoning questions themselves.

You are generating a **${levelDescriptions[hintLevel as 1 | 2 | 3]}**.

Keep your response punchy, supportive, and formatted in clean Markdown with emojis.`;

    const userContent = `Topic: ${topicTitle || 'Aptitude & Reasoning'}\nQuestion:\n${questionText}\n\nRequested Hint Level: ${hintLevel}`;

    let hint = '';
    try {
      const geminiResult = await callGeminiWithRotation({
        systemInstruction,
        contents: userContent,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 500,
          topP: 0.9,
          thinking_config: {
            thinking_budget: 128
          }
        }
      });
      hint = geminiResult.text;
    } catch (apiErr) {
      console.warn('[/api/ai/aptitude-socratic-hint] Fallback hint used:', apiErr);
    }

    if (!hint) {
      if (hintLevel === 1) {
        hint = `💡 **Intuition Spark:** Look closely at the relationship between the quantities. Can you simplify them into a basic ratio or reciprocal fraction (like 1/8 = 12.5%) before doing any math?`;
      } else if (hintLevel === 2) {
        hint = `⚡ **Formula Anchor:** Convert the rates into LCM units or use $Net = a + b + \\frac{ab}{100}$. Avoid defining multiple variables ($x, y$)!`;
      } else {
        hint = `🎯 **Visual Eureka:** Eliminate the extreme options! Notice that when two items sell for the same price at $+x\\%$ and $-x\\%$, the result is always a loss of $(\\frac{x}{10})^2\\%$.`;
      }
    }

    return NextResponse.json({
      success: true,
      hintLevel,
      hint,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[/api/ai/aptitude-socratic-hint] error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate Socratic hint' },
      { status: 500 }
    );
  }
}
