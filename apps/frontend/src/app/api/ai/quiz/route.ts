import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionFromRequest } from '@/lib/auth';
import { callGeminiWithRotation } from '@/lib/gemini';

const QuizSchema = z.object({
  topic:      z.string().min(2, 'Topic is required').max(200),
  difficulty: z.enum(['easy', 'medium', 'hard', 'basic']).default('medium'),
  count:      z.number().int().min(1).max(25).default(10),
  courseContext: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    const body = await request.json();
    const parsed = QuizSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { topic, difficulty, count, courseContext } = parsed.data;
    const diffLevel = difficulty === 'basic' ? 'easy' : difficulty;

    const systemInstruction = `You are a Principal Software Engineer and Technical Interviewer generating rigorous, technically accurate multiple-choice questions for software engineers.

CRITICAL QUALITY STANDARDS:
1. CONCEPT FOCUS: Every question must test ONE specific concept clearly.
2. TECHNICAL ACCURACY: Operation-specific complexity, accurate behavior, no incorrect claims.
3. PLAUSIBLE OPTIONS: All 4 options must belong to the exact same conceptual category.
4. UNAMBIGUOUS SINGLE BEST ANSWER: Exactly ONE option is correct.
5. CONCISE TEXT: Keep explanations and reasons short (1-2 sentences) to maintain concise token footprint.`;

    const prompt = `Generate exactly ${count} multiple-choice quiz questions for the topic "${topic}" at "${diffLevel}" difficulty level${courseContext ? ` within the context of "${courseContext}"` : ''}.

Return ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "question": "Concept-focused question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Concise reason why correct.",
      "distractorReason": "Concise reason why distractors are incorrect.",
      "practicalTakeaway": "One key practical takeaway.",
      "followUpQuestion": "Short follow-up question.",
      "followUpAnswer": "Concise answer."
    }
  ]
}`;

    let quizQuestions: unknown[] = [];
    try {
      const geminiResult = await callGeminiWithRotation({
        systemInstruction,
        contents: prompt,
        generationConfig: {
          temperature:      0.2,
          maxOutputTokens:  8192,
          responseMimeType: 'application/json',
        },
      });

      let rawJson = geminiResult.text.trim();
      try {
        const parsedData = JSON.parse(rawJson);
        if (Array.isArray(parsedData?.questions) && parsedData.questions.length > 0) {
          quizQuestions = parsedData.questions;
        }
      } catch (parseErr) {
        const matches = rawJson.match(/\{[^{}]*"question"[^{}]*"options"[^{}]*\}/g);
        if (matches && matches.length > 0) {
          const recovered = matches.map(m => {
            try { return JSON.parse(m); } catch (e) { return null; }
          }).filter(Boolean);
          if (recovered.length > 0) {
            quizQuestions = recovered;
          }
        }
      }
    } catch (e) {
      console.warn('[/api/ai/quiz] Gemini API error across key pool, using fallback:', e);
    }

    if (!quizQuestions || quizQuestions.length === 0) {
      quizQuestions = generateFallbackQuiz(topic, diffLevel, count);
    }

    // Standardize, validate, and normalize questions
    const normalizedQuestions = (quizQuestions as any[]).map((q: any, idx: number) => {
      let correctIdx = 0;
      const rawCorrect = q.correct ?? q.correctAnswer ?? q.correct_answer ?? q.answer ?? q.correctIndex ?? 0;
      
      if (typeof rawCorrect === 'number') {
        correctIdx = Math.max(0, Math.min(rawCorrect, (q.options?.length || 4) - 1));
      } else if (typeof rawCorrect === 'string') {
        const trimmed = rawCorrect.trim().toUpperCase();
        if (trimmed === 'A' || trimmed === 'OPTION A' || trimmed === '0') correctIdx = 0;
        else if (trimmed === 'B' || trimmed === 'OPTION B' || trimmed === '1') correctIdx = 1;
        else if (trimmed === 'C' || trimmed === 'OPTION C' || trimmed === '2') correctIdx = 2;
        else if (trimmed === 'D' || trimmed === 'OPTION D' || trimmed === '3') correctIdx = 3;
        else {
          const parsedNum = parseInt(trimmed, 10);
          correctIdx = isNaN(parsedNum) ? 0 : Math.max(0, Math.min(parsedNum, (q.options?.length || 4) - 1));
        }
      }

      return {
        id: q.id || `quiz_q_${Date.now()}_${idx}`,
        question: q.question || `Question ${idx + 1}`,
        options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correct: correctIdx,
        correctAnswer: correctIdx,
        explanation: q.explanation || 'Review the topic concepts to understand the solution.',
        distractorReason: q.distractorReason || '',
        practicalTakeaway: q.practicalTakeaway || '',
        followUpQuestion: q.followUpQuestion || '',
        followUpAnswer: q.followUpAnswer || '',
      };
    });

    return NextResponse.json({
      success:   true,
      topic,
      difficulty: diffLevel,
      questions: normalizedQuestions,
      generatedAt: new Date().toISOString(),
    });

  } catch (error: unknown) {
    console.error('[/api/ai/quiz]', error);
    return NextResponse.json({ success: false, message: 'Quiz generation error.' }, { status: 500 });
  }
}

function generateFallbackQuiz(topic: string, difficulty: string, count: number) {
  const isJava = /java|spring|microservice|jvm/i.test(topic);
  const isPython = /python|data|pandas|numpy|datascience/i.test(topic);
  const isDevOps = /devops|docker|kubernetes|ci\/cd|cloud|terraform|ansible/i.test(topic);

  if (isJava) {
    const javaPool = [
      {
        question: 'Which Java collection provides expected O(1) average-time lookup by key under typical hashing conditions?',
        options: ['HashMap', 'TreeMap', 'ArrayList', 'LinkedList'],
        correct: 0,
        explanation: 'HashMap computes the hash code of the key to index directly into internal buckets.',
        distractorReason: 'TreeMap has O(log n) lookup because it maintains sorted order via a Red-Black Tree.',
        practicalTakeaway: 'Use HashMap when order does not matter and fast key lookups are needed.',
        followUpQuestion: 'Why does TreeMap have O(log n) lookup?',
        followUpAnswer: 'TreeMap is implemented as a Red-Black Tree requiring log n comparisons.'
      },
      {
        question: 'How do Virtual Threads in Java 21 improve throughput for I/O-bound microservice workloads?',
        options: [
          'They unmount from the carrier thread when blocking, allowing other virtual threads to execute on that OS thread.',
          'They execute blocking I/O calls asynchronously on a dedicated native OS thread pool automatically.',
          'They convert synchronous network sockets into reactive streams at the bytecode level.',
          'They double the CPU clock cycle efficiency of the host JVM.'
        ],
        correct: 0,
        explanation: 'When a Virtual Thread executes a blocking operation, it unmounts from its carrier platform thread.',
        distractorReason: 'Virtual threads do not make CPU instructions faster; they eliminate OS thread starvation overhead.',
        practicalTakeaway: 'Virtual threads shine for high-concurrency blocking I/O applications.',
        followUpQuestion: 'What causes a virtual thread to pin to its carrier thread?',
        followUpAnswer: 'Synchronized blocks or native methods (JNI) prevent unmounting.'
      },
      {
        question: 'In Spring Boot, why is constructor injection preferred over field injection with @Autowired?',
        options: [
          'It enforces immutability with final fields and enables straightforward unit testing without reflection.',
          'It speeds up application startup time by avoiding bytecode compilation.',
          'It allows Spring to bypass the application context when instantiating beans.',
          'It automatically enables distributed caching on all injected beans.'
        ],
        correct: 0,
        explanation: 'Constructor injection allows dependencies to be declared as final and easily mocked in unit tests.',
        distractorReason: 'Field injection hides dependencies and makes testing harder.',
        practicalTakeaway: 'Always use constructor injection in modern Spring Boot services.',
        followUpQuestion: 'How does Spring handle circular dependencies with constructor injection?',
        followUpAnswer: 'It fails fast at startup with a BeanCurrentlyInCreationException.'
      },
      {
        question: 'Which method in Java ArrayList has O(1) time complexity?',
        options: ['get(int index)', 'indexOf(Object o)', 'add(0, E element)', 'remove(Object o)'],
        correct: 0,
        explanation: 'ArrayList is backed by a contiguous array, allowing constant-time memory offset access by index.',
        distractorReason: 'indexOf and remove require linear scans. Adding at index 0 shifts all elements.',
        practicalTakeaway: 'Use ArrayList when indexed lookups are frequent.',
        followUpQuestion: 'What is the amortized cost of adding to the end of an ArrayList?',
        followUpAnswer: 'Amortized O(1).'
      },
      {
        question: 'What is the primary difference between pessimistic locking and optimistic locking in relational databases?',
        options: [
          'Pessimistic locking locks the database row on read (e.g. SELECT FOR UPDATE), while optimistic locking checks a version column on commit.',
          'Pessimistic locking is only supported in NoSQL databases, while optimistic locking is for SQL.',
          'Optimistic locking acquires an exclusive row lock for the entire duration of the transaction.',
          'Pessimistic locking never causes transaction deadlocks under concurrent write load.'
        ],
        correct: 0,
        explanation: 'Pessimistic locks rows upfront; optimistic validates version numbers on commit.',
        distractorReason: 'Optimistic locking avoids database row locks to increase throughput.',
        practicalTakeaway: 'Use optimistic locking for high-read/low-write contention domains.',
        followUpQuestion: 'What exception is thrown on optimistic lock failure?',
        followUpAnswer: 'OptimisticLockException.'
      },
      {
        question: 'In Java ConcurrentHashMap, how is thread safety achieved without locking the entire map?',
        options: [
          'Using CAS (Compare-And-Swap) for empty bucket insertions and synchronized locks on individual bucket head nodes.',
          'By creating a deep copy of the entire underlying array on every write operation.',
          'By delegating all write operations to a single background daemon thread.',
          'By storing all key-value entries in off-heap native memory.'
        ],
        correct: 0,
        explanation: 'ConcurrentHashMap locks only individual bucket heads, allowing concurrent writes to different buckets.',
        distractorReason: 'CopyOnWriteArrayList uses array copies, not ConcurrentHashMap.',
        practicalTakeaway: 'Use ConcurrentHashMap for thread-safe high-throughput concurrent caching.',
        followUpQuestion: 'Does ConcurrentHashMap permit null keys or values?',
        followUpAnswer: 'No, null keys and values are strictly prohibited in ConcurrentHashMap.'
      },
      {
        question: 'What happens when an unhandled exception occurs inside a method annotated with Spring @Transactional?',
        options: [
          'The transaction is rolled back by default if the exception is a RuntimeException or Error.',
          'The transaction is automatically committed and the exception is swallowed.',
          'The transaction is converted into a distributed two-phase commit.',
          'Checked exceptions trigger rollback by default without rollbackFor configuration.'
        ],
        correct: 0,
        explanation: 'Spring rolls back transactions on unchecked exceptions (RuntimeException and Error) by default.',
        distractorReason: 'Checked exceptions do not trigger rollback unless rollbackFor is explicitly specified.',
        practicalTakeaway: 'Specify @Transactional(rollbackFor = Exception.class) if checked exceptions should trigger rollback.',
        followUpQuestion: 'Does calling a @Transactional method from another method in the same class trigger proxy transaction interception?',
        followUpAnswer: 'No, internal calls bypass the Spring proxy interceptor.'
      },
      {
        question: 'Which garbage collector in modern OpenJDK aims for sub-millisecond maximum pause times regardless of heap size?',
        options: ['ZGC (Z Garbage Collector)', 'Serial GC', 'Parallel GC', 'CMS Collector'],
        correct: 0,
        explanation: 'ZGC performs concurrent marking and relocation with colored pointers and load barriers.',
        distractorReason: 'Parallel GC prioritizes throughput over pause time; Serial GC is single-threaded.',
        practicalTakeaway: 'Enable -XX:+UseZGC for latency-sensitive microservices.',
        followUpQuestion: 'What is Generational ZGC in Java 21?',
        followUpAnswer: 'It separates young and old generations to improve allocation throughput while preserving sub-millisecond pauses.'
      },
      {
        question: 'In Spring Cloud / Microservices, what is the primary role of a Circuit Breaker (e.g. Resilience4j)?',
        options: [
          'Prevent cascading failures by failing fast when downstream services become unresponsive.',
          'Encrypt all intra-service HTTP payloads using TLS certificates.',
          'Balance incoming network traffic across multiple Kubernetes pods.',
          'Compress JSON responses before sending them over the wire.'
        ],
        correct: 0,
        explanation: 'Circuit breakers open to prevent thread starvation and give failing services time to recover.',
        distractorReason: 'Traffic routing is handled by API Gateways; TLS handles encryption.',
        practicalTakeaway: 'Configure fallback methods on circuit breakers to return cached or default responses.',
        followUpQuestion: 'What are the three main states of a circuit breaker?',
        followUpAnswer: 'CLOSED (normal), OPEN (failing fast), and HALF_OPEN (probing recovery).'
      },
      {
        question: 'What is the memory difference between Java String literal pool and new String("abc")?',
        options: [
          'String literals reside in the String Pool (interned in heap), whereas new String() creates a distinct new heap object.',
          'String literals are allocated on the thread stack, whereas new String() is allocated on the heap.',
          'String literals are mutable, whereas new String() is immutable.',
          'new String() is automatically garbage collected at JVM shutdown only.'
        ],
        correct: 0,
        explanation: 'Literals reuse pooled instances in heap memory; new String() allocates a separate object.',
        distractorReason: 'All Java Strings are immutable heap objects.',
        practicalTakeaway: 'Prefer string literals or StringBuilder rather than calling new String().',
        followUpQuestion: 'What does String.intern() do?',
        followUpAnswer: 'It returns the canonical reference from the String pool.'
      },
      {
        question: 'In Hibernate/JPA, what is the N+1 select query problem?',
        options: [
          'Fetching 1 parent entity triggers N separate queries to fetch each related child entity.',
          'Executing N insert statements inside a single transaction without a commit.',
          'Connecting N database connection pool sessions simultaneously.',
          'Creating N database tables for a single JPA entity class.'
        ],
        correct: 0,
        explanation: 'Lazy loading un-joined relationships causes 1 query for parents plus N queries for children.',
        distractorReason: 'It is a query explosion problem caused by lazy loading without join fetch.',
        practicalTakeaway: 'Use JOIN FETCH or Entity Graphs to load parent and child entities in a single SQL query.',
        followUpQuestion: 'How does @BatchSize mitigate the N+1 problem?',
        followUpAnswer: 'It batches child ID lookups using SQL IN (?, ?, ...) clauses.'
      },
      {
        question: 'What is the time complexity of building a Binary Heap with N elements using bottom-up heapify?',
        options: ['O(N)', 'O(N log N)', 'O(N^2)', 'O(log N)'],
        correct: 0,
        explanation: 'Bottom-up heap construction runs in linear O(N) time due to converging mathematical series.',
        distractorReason: 'Inserting N elements one-by-one into an empty heap takes O(N log N), but bottom-up heapify is O(N).',
        practicalTakeaway: 'Use PriorityQueue constructor with collection for O(N) initialization.',
        followUpQuestion: 'What is the time complexity of poll() on a PriorityQueue?',
        followUpAnswer: 'O(log N) to restore heap property after root removal.'
      },
      {
        question: 'What is the difference between Comparable and Comparator interfaces in Java?',
        options: [
          'Comparable defines natural ordering in the class (compareTo), while Comparator defines custom external ordering (compare).',
          'Comparable is for collections, while Comparator is only for primitive arrays.',
          'Comparator modifies the original class bytecode at runtime.',
          'Comparable cannot be used with Collections.sort().'
        ],
        correct: 0,
        explanation: 'Comparable imposes natural order inside the entity class; Comparator allows flexible external sorting strategies.',
        distractorReason: 'Both work with standard sorting utilities.',
        practicalTakeaway: 'Implement Comparable for natural sort order; use Comparator lambdas for dynamic sorts.',
        followUpQuestion: 'Can Comparator be chained using .thenComparing()?',
        followUpAnswer: 'Yes, Comparator allows fluent multi-field comparison chaining.'
      },
      {
        question: 'In Kafka, what guarantees strict message ordering within a topic?',
        options: [
          'Messages published with the same partition key are written to the same partition and consumed in order.',
          'Kafka guarantees global FIFO ordering across all partitions automatically.',
          'Setting consumer group concurrency to maximum threads.',
          'Enabling message compression with Snappy.'
        ],
        correct: 0,
        explanation: 'Ordering is strictly guaranteed within a single partition for messages sharing the same key.',
        distractorReason: 'Kafka does not guarantee total ordering across multiple partitions.',
        practicalTakeaway: 'Use entity ID (e.g. orderId) as partition key to maintain order per business entity.',
        followUpQuestion: 'What happens if a partition key is null in Kafka?',
        followUpAnswer: 'Messages are distributed round-robin / sticky partitioned across available partitions.'
      },
      {
        question: 'What is the role of the volatile keyword in Java memory concurrency?',
        options: [
          'Guarantees memory visibility across CPU caches and prevents instruction reordering (happens-before relationship).',
          'Acquires an exclusive mutual exclusion lock on the variable for atomic compound operations.',
          'Allocates the variable in native C++ heap memory.',
          'Ensures the variable is automatically serialized across network sockets.'
        ],
        correct: 0,
        explanation: 'volatile ensures reads and writes go directly to main memory and prevents compiler reordering.',
        distractorReason: 'volatile does NOT make compound operations like count++ atomic; use AtomicInteger for that.',
        practicalTakeaway: 'Use volatile for single-variable state flags (e.g. boolean running).',
        followUpQuestion: 'Why is volatile int counter = 0; counter++ not thread-safe?',
        followUpAnswer: 'Because counter++ consists of three distinct operations: read, increment, and write back.'
      }
    ];
    return javaPool.slice(0, count);
  }

  const defaultPool = [
    {
      question: 'Which algorithm provides O(log n) search time in a sorted array?',
      options: ['Binary Search', 'Linear Search', 'Bubble Sort', 'Breadth-First Search'],
      correct: 0,
      explanation: 'Binary Search halves the search space with each comparison in sorted arrays.',
      distractorReason: 'Linear Search takes O(n). Bubble Sort is an O(n^2) sorting algorithm.',
      practicalTakeaway: 'Always verify data is sorted before attempting binary search.',
      followUpQuestion: 'What is the space complexity of iterative Binary Search?',
      followUpAnswer: 'O(1) auxiliary space.'
    },
    {
      question: 'What is the primary benefit of making REST APIs stateless?',
      options: [
        'Enables horizontal scaling across multiple application instances behind a load balancer.',
        'Eliminates the need for any database persistence layer.',
        'Guarantees zero network latency for all incoming requests.',
        'Forces the client to recompile bytecode on every request.'
      ],
      correct: 0,
      explanation: 'Stateless servers do not retain client session state in server memory.',
      distractorReason: 'Statelessness simplifies horizontal scaling and fault tolerance.',
      practicalTakeaway: 'Store session state in client JWT tokens or distributed stores (e.g. Redis).',
      followUpQuestion: 'How does an Idempotent HTTP method differ from a Safe HTTP method?',
      followUpAnswer: 'Safe methods do not modify server state; Idempotent methods produce the same result when repeated.'
    }
  ];

  return defaultPool.slice(0, count);
}
