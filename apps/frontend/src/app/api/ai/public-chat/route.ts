import { NextRequest, NextResponse } from 'next/server';
import { callGeminiWithRotation } from '@/lib/gemini';
import { query, execute } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

const publicChatRateLimit = new Map<string, { count: number; resetTime: number }>();
const MAX_CHAT_CALLS = 20;
const CHAT_WINDOW_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const now = Date.now();
    const rateRecord = publicChatRateLimit.get(clientIp);
    if (!rateRecord || now > rateRecord.resetTime) {
      publicChatRateLimit.set(clientIp, { count: 1, resetTime: now + CHAT_WINDOW_MS });
    } else {
      if (rateRecord.count >= MAX_CHAT_CALLS) {
        return NextResponse.json(
          { success: false, message: 'Too many messages sent. Please wait a minute before chatting again.' },
          { status: 429 }
        );
      }
      rateRecord.count += 1;
    }

    const body = await request.json();
    let prompt = body?.prompt || body?.message || '';
    if (!prompt && Array.isArray(body?.messages) && body.messages.length > 0) {
      const lastMsg = body.messages[body.messages.length - 1];
      prompt = lastMsg?.text || lastMsg?.content || lastMsg?.message || '';
    }
    const history = body?.history || body?.messages;
    const leadData = body?.leadData;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, message: 'Prompt is required.' }, { status: 400 });
    }

    // Optional lead capture if user provides contact info in chat
    if (leadData && leadData.email) {
      try {
        await execute(
          `INSERT INTO crm_leads (name, email, phone, source, status, notes, created_at)
           VALUES (?, ?, ?, 'ai_chatbot', 'new', ?, NOW())`,
          [
            leadData.name || 'AI Chat Visitor',
            leadData.email.trim().toLowerCase(),
            leadData.phone || 'N/A',
            `Lead from Public AI Chatbot. User inquired: "${prompt.slice(0, 150)}"`,
          ]
        );
      } catch (leadErr) {
        console.warn('AI Chat lead capture error:', leadErr);
      }
    }

    // Fetch dynamic courses & live masterclasses from MySQL
    let dynamicCoursesInfo = '';
    let dynamicWebinarsInfo = '';

    try {
      const courses = await query<RowDataPacket[]>(
        `SELECT id, title, slug, description, level, duration, price FROM courses WHERE status = 'published' OR status IS NULL`
      );
      dynamicCoursesInfo = courses
        .map(
          (c) =>
            `• ${c.title} (Slug: /courses/${c.slug}, Level: ${c.level}, Duration: ${c.duration}, Fee: ₹${c.price}) - ${c.description}`
        )
        .join('\n');

      const webinars = await query<RowDataPacket[]>(
        `SELECT title, instructor_name, scheduled_at, duration_minutes, status FROM live_classes ORDER BY scheduled_at ASC LIMIT 4`
      );
      dynamicWebinarsInfo = webinars
        .map(
          (w) =>
            `• "${w.title}" with ${w.instructor_name} (${w.status === 'live' ? 'LIVE NOW' : 'Upcoming at ' + (w.scheduled_at ? new Date(w.scheduled_at).toDateString() : 'TBD')})`
        )
        .join('\n');
    } catch (dbErr) {
      console.warn('Failed to load dynamic courses for AI Chat context:', dbErr);
    }

    const systemInstruction = `You are the **Education Algorithm AI Student Counselor & Academic Advisor**.
You are a friendly, highly knowledgeable, and encouraging advisor helping students, working professionals, and tech enthusiasts learn about courses, syllabus topics, career roadmaps, and webinars at Education Algorithm.

### 🏛️ Platform Highlights & Stats:
- **Features:** HD Live & Recorded Lessons, Docker Piston Sandboxes, 1-on-1 Faculty Doubts Resolution, Capstone Projects & Verified Industry Certificates.

### 📚 Available Cohort Tracks:
${dynamicCoursesInfo || `1. Java Full Stack & Cloud Engineering (6 Months, ₹24,999) - Core Java 21, Spring Boot 3, Microservices, Kafka, Redis, Docker, Kubernetes, System Design (LLD & HLD).
2. Data Science, Machine Learning & GenAI (5 Months, ₹29,999) - Python, Neural Networks, PyTorch, LangChain, RAG Architecture, Vector DBs, Gemini API, Autonomous Multi-Agent Systems.
3. DevOps & Multi-Cloud Architecture (4 Months, ₹21,999) - Linux, Docker, Kubernetes, Terraform, AWS, Azure, CI/CD with GitHub Actions, Observability with Prometheus & Grafana.`}

### 🎥 Live Masterclasses & Webinars:
${dynamicWebinarsInfo || `• Upcoming live masterclasses hosted by FAANG Lead Architects available at /webinars with free seat reservation.`}

### 💬 Guidelines for Your Responses:
1. **Be Enthusiastic & Practical:** Give clear, structured, and easy-to-understand advice.
2. **Recommend the Right Program:** If a user asks "Which course should I take?", recommend based on their background (e.g. backend/enterprise -> Java Full Stack; AI/ML/data -> GenAI & Agentic Systems; cloud/infrastructure -> DevOps).
3. **Deep Topic Explanations:** If asked about a technical topic (e.g., "What is Spring Boot?", "What is RAG in AI?", "What are Virtual Threads?"), explain it clearly with an intuitive analogy, why it matters in production, and which module covers it.
4. **Actionable Links:** When mentioning courses or masterclasses, encourage them to explore \`/courses\` or \`/webinars\`.
5. **Conciseness:** Keep answers punchy, well-formatted with markdown, bolding, and bullet points.`;

    let conversationText = '';
    if (Array.isArray(history) && history.length > 0) {
      conversationText = history
        .slice(-6)
        .map((h: { sender: string; text: string }) => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
        .join('\n\n') + '\n\n';
    }
    conversationText += `User: ${prompt}\nAssistant:`;

    let reply = '';
    try {
      const geminiResult = await callGeminiWithRotation({
        systemInstruction,
        contents: conversationText,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.9,
        },
      });
      reply = geminiResult.text;
    } catch (apiErr) {
      console.warn('[/api/ai/public-chat] Gemini API failed:', apiErr);
    }

    if (!reply) {
      reply = getSmartPublicFallback(prompt);
    }

    return NextResponse.json({
      success: true,
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[/api/ai/public-chat]', error);
    return NextResponse.json({ success: false, message: 'AI advisor encountered an error.' }, { status: 500 });
  }
}

function getSmartPublicFallback(prompt: string): string {
  const p = prompt.toLowerCase();

  if (p.includes('java') || p.includes('spring') || p.includes('backend')) {
    return `### ☕ Java Full Stack & System Design Track
Our flagship program covers:
- **Java 21 & Concurrency:** Virtual Threads (Project Loom), JVM internals, and multithreading.
- **Spring Boot 3 & Security 6:** Microservices, JPA/Hibernate, Kafka event streaming, and Redis caching.
- **System Design:** Low-Level Design (LLD patterns) & High-Level Distributed Systems.
- **DevOps:** Docker, Kubernetes & CI/CD deployment.

👉 [View Complete Java Cohort Curriculum](/courses/java-full-stack-cloud-engineering)`;
  }

  if (p.includes('ai') || p.includes('genai') || p.includes('data science') || p.includes('rag') || p.includes('python')) {
    return `### 🤖 Data Science, GenAI & Agentic Systems Track
Our cutting-edge AI program covers:
- **Python & ML Foundations:** NumPy, Pandas, Scikit-Learn, and PyTorch deep learning.
- **Enterprise RAG Architectures:** Vector databases (Chroma/Pinecone), semantic embeddings, and LangChain.
- **Autonomous Multi-Agent Systems:** LangGraph, AutoGen, and fine-tuning open-source LLMs (Llama 3).

👉 [View GenAI Cohort Curriculum](/courses/data-science-machine-learning-genai)`;
  }

  if (p.includes('webinar') || p.includes('masterclass') || p.includes('live')) {
    return `### 🎥 Live Senior FAANG Masterclasses
We host regular interactive live sessions on System Design, AI Architectures, and DevOps pipelines with lead engineers.
- You can reserve a free seat or watch past recorded archives.
- Includes direct Google Meet room access and live Q&A!

👉 [Explore Upcoming Live Masterclasses](/webinars)`;
  }

  if (p.includes('placement') || p.includes('job') || p.includes('salary') || p.includes('hiring')) {
    return `### 💼 Career Outcomes & Placement Support
- **Average Package:** ₹14.5 LPA | **Highest Package:** ₹44.0 LPA
- **Placement Rate:** 98.4%
- **Hiring Partners:** Google, Amazon, Microsoft, Meta, Uber, Razorpay, and 500+ tech enterprises.
- **Career Services:** 1-on-1 Resume Reviews, Mock Technical Interviews, and Direct Referral Network.`;
  }

  return `### 🎓 Education Algorithm Academic Advisor
Welcome! I'm here to help you choose the best engineering path:
- **Java Full Stack & Cloud Engineering** (Spring Boot 3, Kafka, Redis, Microservices)
- **Data Science & GenAI Agentic Systems** (PyTorch, RAG, Multi-Agent Systems, LLMs)
- **DevOps & Multi-Cloud Architecture** (Kubernetes, Terraform, AWS/Azure, CI/CD)

Feel free to ask about any curriculum topic, prerequisite, upcoming live webinar, or placement support!`;
}
