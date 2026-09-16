import { NextRequest, NextResponse } from 'next/server';
import { callGeminiWithRotation } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, weekNumber, phase, difficulty } = body;

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Please provide a project topic or goal.' },
        { status: 400 }
      );
    }

    const weekNum = weekNumber || 1;
    const defaultPhase = phase || (weekNum <= 4 ? 'Phase 1: Core Java & Concurrency' : weekNum <= 8 ? 'Phase 2: DB, JPA & Spring Boot' : weekNum <= 12 ? 'Phase 3: Enterprise Microservices & Kafka' : 'Phase 4: Microservices & GenAI');
    const defaultDiff = difficulty || (weekNum <= 4 ? 'Foundations' : weekNum <= 8 ? 'Intermediate' : weekNum <= 12 ? 'Advanced' : 'Production Capstone');

    const prompt = `You are a Senior Principal Software Architect and Lead Curriculum Designer for an elite Java Full-Stack, Cloud & GenAI Engineering Academy.

Generate a comprehensive, industry-grade weekly milestone target specification for:
- Topic / Learning Objective: "${topic}"
- Week Number: Week ${weekNum}
- Preferred Phase: "${defaultPhase}"
- Preferred Difficulty: "${defaultDiff}"

You MUST respond strictly with a valid JSON object (NO markdown fences, NO backticks, NO extra conversational text).

JSON format schema:
{
  "title": "Clear, impressive enterprise project title (e.g. High-Throughput Event-Driven Payment Gateway)",
  "phase": "${defaultPhase}",
  "difficulty": "${defaultDiff}",
  "description": "2-3 detailed sentences describing the real-world problem, architectural goals, concurrency/reliability considerations, and what the student will engineer.",
  "techStack": ["4 to 6 specific production technologies, e.g. Java 21, Spring Boot 3, Apache Kafka, Redis, Docker, PostgreSQL"],
  "architectureNodes": [
    "Architecture Component 1 (e.g. Ingestion API Gateway & Rate Limiter)",
    "Architecture Component 2 (e.g. Event Broker & Partitioned Consumer Group)",
    "Architecture Component 3 (e.g. Idempotent State Machine & Deadlock-Free Ledger)",
    "Architecture Component 4 (e.g. Telemetry Exporter & Health Probe Agent)"
  ],
  "rubric": [
    "Grading Criterion 1 - Core Business Logic & Architecture (25 pts)",
    "Grading Criterion 2 - Concurrency / Resilience / Security (25 pts)",
    "Grading Criterion 3 - Testing & Code Quality (>80% unit/integration tests) (25 pts)",
    "Grading Criterion 4 - Production Deployment / Docker / API Specs (25 pts)"
  ],
  "githubTemplate": "https://github.com/spring-projects/spring-petclinic"
}`;

    let parsedResult = null;

    try {
      const geminiResponse = await callGeminiWithRotation({
        contents: prompt,
        systemInstruction: 'You are an expert software engineering curriculum architect. Always respond with raw valid JSON only.'
      });

      if (geminiResponse && geminiResponse.text) {
        let cleanText = geminiResponse.text.trim();
        // Remove markdown backticks if returned
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
        }

        parsedResult = JSON.parse(cleanText);
      }
    } catch (aiErr) {
      console.warn('Gemini API call failed or rate limited, using smart heuristic project synthesizer:', aiErr);
    }

    // Fallback if AI generation failed or wasn't parsed
    if (!parsedResult || !parsedResult.title) {
      const cleanTopic = topic.trim();
      parsedResult = {
        title: cleanTopic.length > 5 ? cleanTopic : `Week ${weekNum}: Enterprise Cloud Service`,
        phase: defaultPhase,
        difficulty: defaultDiff,
        description: `Design and engineer a production-grade system focused on ${cleanTopic}. Implement enterprise patterns, thread safety, rigorous error handling, and robust persistence.`,
        techStack: ['Java 21', 'Spring Boot 3', 'PostgreSQL', 'Docker', 'JUnit 5 / Testcontainers'],
        architectureNodes: [
          'RESTful API Gateway & Validation Layer',
          'Business Domain Service & Transaction Manager',
          'High-Throughput Data Persistence Layer',
          'Automated Unit & Integration Test Suite'
        ],
        rubric: [
          'Architectural Cleanliness & SOLID Principles (25 pts)',
          'Thread-Safety, Edge-Case & Exception Handling (25 pts)',
          'Automated Unit & Integration Tests (>80% coverage) (25 pts)',
          'Docker Containerization & Documentation (25 pts)'
        ],
        githubTemplate: 'https://github.com/spring-projects/spring-petclinic'
      };
    }

    return NextResponse.json({
      success: true,
      project: {
        weekNumber: weekNum,
        title: parsedResult.title,
        phase: parsedResult.phase || defaultPhase,
        difficulty: parsedResult.difficulty || defaultDiff,
        description: parsedResult.description,
        techStack: Array.isArray(parsedResult.techStack) ? parsedResult.techStack : ['Java 21', 'Spring Boot 3'],
        architectureNodes: Array.isArray(parsedResult.architectureNodes) ? parsedResult.architectureNodes : ['Core Service', 'DB Engine'],
        rubric: Array.isArray(parsedResult.rubric) ? parsedResult.rubric : ['Architecture (25 pts)', 'Testing (25 pts)'],
        githubTemplate: parsedResult.githubTemplate || 'https://github.com/spring-projects/spring-petclinic'
      }
    });
  } catch (error: any) {
    console.error('POST /api/ai/generate-project error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate project specifications. ' + (error.message || '') },
      { status: 500 }
    );
  }
}
