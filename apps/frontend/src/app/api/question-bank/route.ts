import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

// GET: Retrieve all active question bank and RAG documents for students and learners
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
    console.error('[/api/question-bank GET]', error);
    return NextResponse.json({ success: false, message: 'Failed to read question bank' }, { status: 500 });
  }
}
