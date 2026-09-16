import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionFromRequest } from '@/lib/auth';
import { callGeminiWithRotation } from '@/lib/gemini';

import { checkAiRateLimit } from '@/lib/aiRateLimiter';

const TutorSchema = z.object({
  prompt:  z.string().min(1, 'Prompt is required').max(2000),
  code:    z.string().max(15000).optional(),
  context: z.string().max(500).optional(), // e.g. "Java Full Stack", "Python DSA"
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    // AI Rate Limiter & Token Quota Guard
    const rateCheck = checkAiRateLimit(request, session?.email || (session as any)?.id || (session as any)?.sub || 'unknown', !!session);
    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }

    const body = await request.json();
    const parsed = TutorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { prompt, code, context } = parsed.data;

    const systemInstruction = `You are the Education Algorithm AI Tutor, a senior-level teaching assistant and mentor specializing in Java Full Stack Development.

Your purpose is not simply to answer questions. Your purpose is to teach the student, build understanding, improve problem-solving ability, prepare them for interviews, and connect concepts to real-world software development.

Follow these rules for EVERY question:

## 1. Understand the Question
First identify:
* The concept being asked
* The student's likely difficulty level: Basic, Medium, or Hard
* Whether the question is theoretical, coding-based, debugging-based, architecture-based, or interview-based
* Any incorrect assumption in the question (do not blindly accept an incorrect premise; correct it politely and explain why).

## 2. Answer Structure
Every answer should follow this structure when appropriate:

### 🎯 Direct Answer
Start with a simple, direct answer in 1–3 sentences.

### 🧠 Simple Explanation
Explain the concept in simple, beginner-friendly terms before introducing technical complexity. Use an analogy if it helps.

### 🏗️ How It Works (Step-by-Step / Internals)
Explain what happens under the hood. Include JVM behavior, memory layout (Stack/Heap/Metaspace), execution lifecycle, architecture flow, or clean ASCII diagrams when helpful.

### 💻 Practical Example / Implementation
Provide clean, readable, production-grade code (Core Java, Spring Boot 3+, Spring Security 6+, JPA/Hibernate, React, Docker).
Rules for code:
* Syntactically correct and follows standard Java / clean code conventions.
* Include meaningful variable names and concise comments.
* When relevant, show both: ❌ Bad / Naive Approach vs ✅ Correct / Production-Grade Approach.

### ⚡ Performance & Resource Implications
Explain:
* Time complexity & Space complexity / Memory usage.
* Database query impact (N+1 queries, indexing, connection pooling).
* Concurrency / thread safety concerns (Virtual Threads, synchronization, locks).

### 🔐 Security Considerations (If Applicable)
Highlight security risks: SQLi, XSS, CSRF, JWT stateless validation, input sanitization, Broken Object Level Auth.

### ⚠️ Real-World Failure Modes / Common Mistakes
Explain:
* Common mistakes developers make in production.
* Edge cases that break this code and debugging tips.

### ✅ Best Practices & Senior Engineer Advice
Provide the industry-standard recommendation:
* When to use it and when NOT to use it.
* Modern Java (17/21+) and Spring Boot 3+ conventions.

### 🎤 Interview-Ready Answer
Provide a crisp 30–60 second elevator pitch that a candidate can say in a tech interview.

### 🧪 Test Yourself (Follow-Up Question)
Provide exactly ONE follow-up challenge for the student (conceptual question, code output question, or edge case) with the answer provided at the end.

## 3. Technology Scope
Core Java (8 to 21), OOP, Collections, Concurrency, JVM Internals, Streams, Multithreading, Exception Handling, Memory Management.
Spring Boot 3+ & Spring Framework (Core, MVC, Security, Data JPA, Cloud, AOP, Microservices).
Databases & ORM (PostgreSQL, MySQL, Redis, Hibernate/JPA, Query Optimization, Indexing, Transactions).
REST APIs & Web (API Design, Idempotency, Status Codes, OpenAPI, WebSockets).
Frontend Basics (React, Next.js, TypeScript, State Management, API integration).
System Design (Monolith vs Microservices, Caching, Kafka, Distributed Transactions, Resiliency, Rate Limiting).
DevOps (Docker, Kubernetes, CI/CD, Maven/Gradle, Linux).

## 4. Teaching Rules & Tone
* Be concise but deep. Avoid conversational filler ("Hello! Welcome").
* Never give incomplete or pseudo-code unless explicitly asked.
* Always prioritize clarity, correctness, and maintainability.
* Adapt depth based on question difficulty: Basic (Clear, patient, foundational), Medium (Detailed, best practices, edge cases), Hard (Deep dive, internals, distributed systems, trade-offs).
* When reviewing student code: Point out bugs first, explain why they occur, provide the fixed version, and suggest performance/style improvements.
${context ? `Current Student Context: ${context}` : ''}`;

    const userContent = code
      ? `${prompt}\n\n\`\`\`\n${code}\n\`\`\``
      : prompt;

    let reply = '';
    try {
      const geminiResult = await callGeminiWithRotation({
        systemInstruction,
        contents: userContent,
        generationConfig: {
          temperature:     0.7,
          maxOutputTokens: 2048,
          topP:            0.9,
        },
      });
      reply = geminiResult.text;
    } catch (apiErr) {
      console.warn('[/api/ai/tutor] Gemini API call failed across key pool:', apiErr);
    }

    if (!reply) {
      reply = generateSmartFallbackResponse(prompt, code);
    }

    return NextResponse.json({
      success:   true,
      reply,
      timestamp: new Date().toISOString(),
    });

  } catch (error: unknown) {
    console.error('[/api/ai/tutor]', error);
    return NextResponse.json(
      { success: false, message: 'AI Tutor encountered an error.' },
      { status: 500 }
    );
  }
}

function generateSmartFallbackResponse(prompt: string, code?: string): string {
  const p = prompt.toLowerCase();
  
  if (p.includes('virtual thread') || p.includes('java 21')) {
    return `### 🚀 Java 21 Virtual Threads vs Platform Threads

**Core Concept:**
Virtual threads (Loom Project in Java 21) are lightweight threads managed by the Java Virtual Machine (JVM) rather than OS kernel threads.

**Key Differences:**
1. **OS Thread Mapping:** Platform threads map 1:1 with OS threads (expensive, ~1MB stack size limit). Virtual threads map $N:M$ onto carrier threads.
2. **Throughput:** You can launch **1,000,000+ Virtual Threads** concurrently without OS memory exhaustion.
3. **Blocking I/O:** When a Virtual Thread blocks on DB/Network I/O, the JVM unmounts it from the carrier thread automatically, allowing other tasks to run.

\`\`\`java
// Creating 10,000 Virtual Threads in Java 21
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10000).forEach(i -> {
        executor.submit(() -> {
            System.out.println("Running task " + i + " on " + Thread.currentThread());
            return i;
        });
    });
} // Auto-closes and awaits completion
\`\`\`

**Best Practice:** Never pool virtual threads. Create them dynamically per request!`;
  }

  if (p.includes('jwt') || p.includes('spring boot') || p.includes('security')) {
    return `### 🛡️ Spring Security JWT Authentication Filter

To secure REST endpoints in Spring Boot with JWT tokens, implement a custom \`OncePerRequestFilter\`:

\`\`\`java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtils.validateToken(token)) {
                String username = jwtUtils.getUsernameFromToken(token);
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(username, null, jwtUtils.getAuthorities(token));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }
        filterChain.doFilter(request, response);
    }
}
\`\`\`

**Architectural Tip:** Always set \`SessionCreationPolicy.STATELESS\` in your \`SecurityFilterChain\` bean so Spring does not create HTTP session cookies!`;
  }

  if (p.includes('rag') || p.includes('vector') || p.includes('embedding') || p.includes('genai')) {
    return `### 🧠 Retrieval-Augmented Generation (RAG) Architecture

**How RAG Works:**
1. **Ingestion & Chunking:** Split large document PDFs/Markdown into overlapping chunks (e.g. 512 tokens with 50-token overlap).
2. **Embedding:** Pass chunks through an embedding model (\`text-embedding-3-small\` or \`bge-m3\`) to produce 1536-dimensional dense vectors.
3. **Indexing:** Store vectors in a Vector Database (Pinecone, Milvus, Qdrant, or pgvector).
4. **Retrieval:** Compute Cosine Similarity between student prompt vector and stored embeddings to retrieve Top-K chunks.
5. **Generation:** Pass prompt + retrieved context chunks to LLM for accurate, hallucination-free answers.

\`\`\`python
# Example RAG Retrieval in Python with LangChain & Qdrant
from langchain_community.vectorstores import Qdrant
from langchain_openai import OpenAIEmbeddings

vector_store = Qdrant.from_documents(
    docs, 
    OpenAIEmbeddings(model="text-embedding-3-small"),
    location=":memory:",
    collection_name="cohort_knowledge_base"
)

retriever = vector_store.as_retriever(search_kwargs={"k": 3})
retrieved_docs = retriever.invoke("How do Spring Boot filters handle exception escalation?")
\`\`\``;
  }

  return `### 💡 Education Algorithm AI Tutor Analysis

Thank you for your question: **"${prompt}"**

${code ? `**Code snippet submitted:**\n\`\`\`\n${code}\n\`\`\`\n` : ''}

**Key Engineering Breakdown:**
1. **Architecture & Logic:** Ensure clear separation of concerns (Controller → Service → Repository pattern).
2. **Performance Optimization:** Analyze algorithmic complexity ($O(N)$ time vs $O(1)$ space memory footprint).
3. **Concurrency & Thread Safety:** Prevent race conditions by using thread-safe abstractions (\`ConcurrentHashMap\` or DB optimistic locks with \`@Version\`).

If you'd like a specific code example or refactoring step for a specific framework (Spring Boot, Python Data Science, or LeetCode DSA), reply with the technology stack!`;
}
