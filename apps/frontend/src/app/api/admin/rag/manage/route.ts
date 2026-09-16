import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { callGeminiWithRotation } from '@/lib/gemini';
import { getSessionFromRequest } from '@/lib/auth';

const STORE_PATH = path.join(process.cwd(), 'src/data/rag-knowledge-store.json');

function readStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading RAG knowledge store:', err);
  }
  return { lastUpdated: new Date().toISOString(), documents: [] };
}

function writeStore(storeData: any) {
  try {
    storeData.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STORE_PATH, JSON.stringify(storeData, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing RAG knowledge store:', err);
    return false;
  }
}

// GET: Retrieve all active RAG knowledge items
export async function GET(req: NextRequest) {
  try {
    const store = readStore();
    return NextResponse.json({
      success: true,
      count: store.documents?.length || 0,
      lastUpdated: store.lastUpdated,
      documents: store.documents || [],
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to read RAG store' }, { status: 500 });
  }
}

// POST: Add, Auto-Structure, or Bulk Ingest
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }

    const body = await req.json();
    const action = body.action || 'add_question';

    // 1. AI SMART-STRUCTURE: Convert raw messy notes into FAANG Q&A
    if (action === 'smart_structure') {
      const { rawText, category } = body;
      if (!rawText?.trim()) {
        return NextResponse.json({ success: false, message: 'Raw text is required for AI structuring.' }, { status: 400 });
      }

      const prompt = `You are an expert Technical Curriculum Engineer and FAANG Interview Author.
Analyze the following unstructured technical notes/text and convert it into a standardized, high-yield Question Bank & RAG Knowledge item.

Target Category Context: ${category || 'Java Full Stack & System Design'}
Raw Text:
"""
${rawText}
"""

Instructions:
1. Extract a clear, professional Title and Problem Statement.
2. Assign Difficulty: "EASY", "MEDIUM", or "HARD".
3. Identify 3-4 top Companies that ask this (e.g. Google, Amazon, Meta, Microsoft, Stripe, Netflix).
4. Extract 6-10 search Keywords/Tags.
5. Provide a deep, canonical Technical Solution explaining the concept and mechanics.
6. Provide production-grade Java 21 implementation code.
7. Provide production-grade Python 3.12 implementation code.
8. Provide 2-3 architectural Key Insights / System Design Tips.
9. Provide exactly 3 specific Canonical Rubric evaluation criteria.

Return ONLY valid JSON matching this exact structure:
{
  "title": "Title here",
  "category": "${category || 'Core Java & System Design'}",
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "companyTags": ["Google", "Amazon", "Meta"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "problemStatement": "Clear problem or concept question...",
  "canonicalSolution": "Detailed canonical solution...",
  "codeJava": "// Java 21 code...",
  "codePython": "# Python 3.12 code...",
  "systemDesignTips": ["Tip 1", "Tip 2"],
  "canonicalRubric": ["Rubric item 1", "Rubric item 2", "Rubric item 3"]
}`;

      try {
        const geminiResult = await callGeminiWithRotation({
          contents: prompt,
          timeoutMs: 35000,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        });

        let jsonText = geminiResult.text.trim();
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        }

        let parsed: any;
        try {
          parsed = JSON.parse(jsonText);
        } catch (parseErr: any) {
          // If JSON is slightly truncated or contains control characters, attempt fallback extraction
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            throw parseErr;
          }
        }

        return NextResponse.json({
          success: true,
          structuredItem: {
            id: `rag_doc_${Date.now()}`,
            pageNumber: 1,
            ...parsed,
          },
        });
      } catch (err: any) {
        console.warn('Smart structuring fallback:', err?.message);
        const titleCandidate = rawText.split('\n')[0].slice(0, 60) || 'Technical Concept Note';
        return NextResponse.json({
          success: true,
          structuredItem: {
            id: `rag_doc_${Date.now()}`,
            title: titleCandidate,
            category: category || 'Core Java & JVM Internals',
            difficulty: 'MEDIUM',
            executionMode: 'batch',
            pageNumber: 1,
            companyTags: ['Google', 'Amazon', 'Microsoft'],
            keywords: [titleCandidate.toLowerCase().slice(0, 30), 'java', 'architecture'],
            problemStatement: `How do you implement and optimize: ${rawText.slice(0, 200)}?`,
            canonicalSolution: rawText,
            codeJava: '// Java 21 Implementation\npublic class Solution {\n    // Implementation details\n}',
            codePython: '# Python 3.12 Implementation\nclass Solution:\n    pass',
            systemDesignTips: ['Ensure thread-safety', 'Monitor latency overhead'],
            canonicalRubric: ['Technical correctness', 'Concurrency safeguards', 'Edge-case handling']
          },
        });
      }
    }

    // 2. ADD SINGLE QUESTION / DOCUMENT
    if (action === 'add_question' || action === 'add_notes') {
      const { item } = body;
      if (!item || !item.title) {
        return NextResponse.json({ success: false, message: 'Invalid document item.' }, { status: 400 });
      }

      const store = readStore();
      const newItem = {
        id: item.id || `rag_doc_${Date.now()}`,
        title: item.title,
        category: item.category || 'General Technical',
        difficulty: (item.difficulty || 'MEDIUM').toUpperCase(),
        executionMode: item.executionMode === 'interactive' ? 'interactive' : 'batch',
        pageNumber: item.pageNumber || store.documents.length + 1,
        companyTags: item.companyTags || ['General Tech'],
        keywords: item.keywords || [item.title.toLowerCase()],
        problemStatement: item.problemStatement || item.title,
        canonicalSolution: item.canonicalSolution || item.content || '',
        codeJava: item.codeJava || '',
        codePython: item.codePython || '',
        systemDesignTips: item.systemDesignTips || [],
        canonicalRubric: item.canonicalRubric || [
          'Correct technical concept explanation',
          'Clean code implementation',
          'Time and space complexity awareness'
        ],
        createdAt: new Date().toISOString(),
      };

      store.documents.unshift(newItem);
      writeStore(store);

      return NextResponse.json({
        success: true,
        message: `Document "${newItem.title}" published to RAG Knowledge Store!`,
        document: newItem,
        totalCount: store.documents.length,
      });
    }

    // 3. BULK INGESTION
    if (action === 'bulk_ingest') {
      const { items } = body;
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, message: 'Items array is required for bulk ingest.' }, { status: 400 });
      }

      const store = readStore();
      const formattedItems = items.map((item: any, idx: number) => ({
        id: item.id || `rag_bulk_${Date.now()}_${idx}`,
        title: item.title || `Curated Technical Note #${idx + 1}`,
        category: item.category || 'General Engineering',
        difficulty: (item.difficulty || 'MEDIUM').toUpperCase(),
        executionMode: item.executionMode === 'interactive' ? 'interactive' : 'batch',
        pageNumber: item.pageNumber || store.documents.length + idx + 1,
        companyTags: item.companyTags || ['FAANG / Top Tech'],
        keywords: item.keywords || [item.title?.toLowerCase() || 'engineering'],
        problemStatement: item.problemStatement || item.title || '',
        canonicalSolution: item.canonicalSolution || item.content || '',
        codeJava: item.codeJava || '',
        codePython: item.codePython || '',
        systemDesignTips: item.systemDesignTips || [],
        canonicalRubric: item.canonicalRubric || ['Core concept mastery', 'Architectural rigor'],
        createdAt: new Date().toISOString(),
      }));

      store.documents = [...formattedItems, ...store.documents];
      writeStore(store);

      return NextResponse.json({
        success: true,
        message: `Successfully bulk-ingested ${formattedItems.length} items into RAG knowledge base!`,
        totalCount: store.documents.length,
      });
    }

    return NextResponse.json({ success: false, message: 'Unknown action.' }, { status: 400 });
  } catch (error: any) {
    console.error('[/api/admin/rag/manage]', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error.' }, { status: 500 });
  }
}

// DELETE: Remove item by ID
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required.' }, { status: 400 });
    }

    const store = readStore();
    const initialCount = store.documents.length;
    store.documents = store.documents.filter((doc: any) => doc.id !== id);

    if (store.documents.length === initialCount) {
      return NextResponse.json({ success: false, message: 'Document not found.' }, { status: 404 });
    }

    writeStore(store);

    return NextResponse.json({
      success: true,
      message: `Document ${id} deleted from RAG Knowledge Base.`,
      remainingCount: store.documents.length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Delete error.' }, { status: 500 });
  }
}
