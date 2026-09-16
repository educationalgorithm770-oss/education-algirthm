import { NextRequest, NextResponse } from 'next/server';
import { callGeminiWithRotation, GeminiContentPart } from '@/lib/gemini';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface ParsedLesson {
  title: string;
  duration?: string;
}

interface ParsedModule {
  title: string;
  description: string;
  lessons: ParsedLesson[];
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin privileges required.' }, { status: 403 });
    }

    const body = await req.json();
    const { text, pdfBase64, courseTitle } = body;

    if ((!text || typeof text !== 'string' || text.trim().length < 3) && !pdfBase64) {
      return NextResponse.json(
        { success: false, error: 'Please upload a PDF syllabus or paste curriculum text.' },
        { status: 400 }
      );
    }

    const rawText = (text || '').trim();
    let parsedModules: ParsedModule[] = [];

    const promptText = `You are an expert curriculum architect and syllabus parsing engine.
Parse the provided syllabus (document or text) into a structured JSON array of modules and lessons for a course titled "${courseTitle || 'Tech Masterclass'}".

Instructions:
1. Divide the topics logically into sequential learning modules (e.g., Module 1, Module 2, ...).
2. Each module must have a concise title (max 100 characters), a brief 1-2 sentence description, and a list of specific lesson topics.
3. Each lesson topic must have a short title (max 120 characters) and an estimated duration (e.g., "30 mins", "45 mins", "1 hour").
4. Return ONLY a valid JSON array matching this exact schema, without markdown code fences or conversational commentary:
[
  {
    "title": "Module 1: Foundations & Architecture",
    "description": "Core principles, design fundamentals, and setup.",
    "lessons": [
      { "title": "Lesson 1: Introduction & Environment Setup", "duration": "30 mins" },
      { "title": "Lesson 2: Core Architecture Deep Dive", "duration": "45 mins" }
    ]
  }
]`;

    try {
      const parts: GeminiContentPart[] = [];

      if (pdfBase64 && typeof pdfBase64 === 'string') {
        const cleanBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, '').trim();
        parts.push({
          inline_data: {
            mime_type: 'application/pdf',
            data: cleanBase64,
          },
        });
      }

      if (rawText && rawText.length > 5 && !pdfBase64) {
        parts.push({
          text: `Syllabus Content to Parse:\n"""\n${rawText.slice(0, 25000)}\n"""`,
        });
      }

      parts.push({ text: promptText });

      const geminiRes = await callGeminiWithRotation({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      if (geminiRes?.text) {
        const cleanJson = geminiRes.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedModules = parsed.map((m: any, idx: number) => ({
            title: String(m.title || `Module ${idx + 1}: Core Engineering`).slice(0, 250),
            description: String(m.description || '').slice(0, 500),
            lessons: Array.isArray(m.lessons)
              ? m.lessons.map((l: any, lIdx: number) => ({
                  title: (typeof l === 'string' ? l : l.title || `Lesson ${lIdx + 1}`).slice(0, 250),
                  duration: (typeof l === 'object' && l.duration ? String(l.duration) : '30 mins').slice(0, 50),
                }))
              : [],
          }));
        }
      }
    } catch (aiErr: any) {
      console.warn('Gemini syllabus parse error:', aiErr?.message || aiErr);
    }

    // Fallback regex parser if AI returns nothing and raw text is present
    if (parsedModules.length === 0 && rawText && !pdfBase64) {
      parsedModules = parseSyllabusWithRegex(rawText);
    }

    if (parsedModules.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Could not extract modules from the syllabus. Please verify the document or try text mode.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      modules: parsedModules,
      totalModules: parsedModules.length,
      totalLessons: parsedModules.reduce((acc, m) => acc + m.lessons.length, 0),
    });
  } catch (error: any) {
    console.error('API /api/admin/courses/parse-syllabus Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function parseSyllabusWithRegex(rawText: string): ParsedModule[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const modules: ParsedModule[] = [];
  let currentModule: ParsedModule | null = null;

  for (const line of lines) {
    const isModuleHeader =
      /^module\s+\d+[:\-]/i.test(line) ||
      /^week\s+\d+[:\-]/i.test(line) ||
      /^chapter\s+\d+[:\-]/i.test(line) ||
      /^section\s+\d+[:\-]/i.test(line) ||
      /^#{1,3}\s+/i.test(line);

    if (isModuleHeader) {
      if (currentModule) {
        modules.push(currentModule);
      }
      const cleanTitle = line.replace(/^#{1,3}\s+/, '').trim().slice(0, 250);
      currentModule = {
        title: cleanTitle,
        description: 'Comprehensive curriculum module covering core engineering practices.',
        lessons: [],
      };
      continue;
    }

    const isLessonItem =
      /^[-*•]\s+/i.test(line) ||
      /^\d+[\.\)]\s+/i.test(line) ||
      /^lesson\s+\d+[:\-]/i.test(line) ||
      /^topic\s+\d+[:\-]/i.test(line);

    if (isLessonItem) {
      const cleanLesson = line
        .replace(/^[-*•]\s+/, '')
        .replace(/^\d+[\.\)]\s+/, '')
        .trim()
        .slice(0, 250);

      if (!currentModule) {
        currentModule = {
          title: 'Module 1: Orientation & Foundations',
          description: 'Core introductory topics and curriculum foundation.',
          lessons: [],
        };
      }
      currentModule.lessons.push({
        title: cleanLesson,
        duration: '30 mins',
      });
      continue;
    }

    if (currentModule && currentModule.lessons.length === 0 && line.length > 10 && line.length < 200) {
      currentModule.description = line.slice(0, 500);
    }
  }

  if (currentModule) {
    modules.push(currentModule);
  }

  if (modules.length === 0) {
    modules.push({
      title: 'Module 1: Course Curriculum Outline',
      description: 'Imported course syllabus topics.',
      lessons: lines.slice(0, 10).map((l) => ({ title: l.slice(0, 250), duration: '30 mins' })),
    });
  }

  return modules;
}
