import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    totalDocuments: 4,
    totalChunks: 6,
    vectorDimensions: 1536,
    indexType: 'HNSW Graph Index (Cosine Similarity)',
    documents: [
      {
        id: 'doc_java21',
        title: 'Java 21 Virtual Threads & Loom Architecture Guide',
        category: 'Java 21 Systems',
        chunkCount: 2,
        lastIndexed: '2026-09-06T12:00:00Z'
      },
      {
        id: 'doc_spring',
        title: 'Spring Boot 3 REST API & JWT Security Blueprint',
        category: 'Java 21 Systems',
        chunkCount: 1,
        lastIndexed: '2026-09-06T12:00:00Z'
      },
      {
        id: 'doc_genai_rag',
        title: 'Enterprise GenAI Retrieval-Augmented Generation Architecture Spec',
        category: 'GenAI & RAG',
        chunkCount: 2,
        lastIndexed: '2026-09-06T12:00:00Z'
      },
      {
        id: 'doc_dsa',
        title: 'Data Structures & Algorithms Production Reference',
        category: 'Data Structures & Algorithms',
        chunkCount: 1,
        lastIndexed: '2026-09-06T12:00:00Z'
      }
    ]
  });
}
