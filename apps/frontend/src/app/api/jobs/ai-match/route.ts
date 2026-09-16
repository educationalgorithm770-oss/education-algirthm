import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { callGeminiWithRotation } from '@/lib/gemini';
import type { RowDataPacket } from 'mysql2';

interface JobRow extends RowDataPacket {
  id: string;
  role_title: string;
  company_name: string;
  tech_stack: string;
  requirements: string;
  domain: string;
  salary_range: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ success: false, message: 'Job ID is required' }, { status: 400 });
    }

    const jobRows = await query<JobRow[]>(
      `SELECT id, role_title, company_name, tech_stack, requirements, domain, salary_range FROM lms_jobs WHERE id = ? LIMIT 1`,
      [jobId]
    );

    if (jobRows.length === 0) {
      return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
    }

    const job = jobRows[0];
    const jobTech: string[] = typeof job.tech_stack === 'string' ? JSON.parse(job.tech_stack) : (job.tech_stack || []);

    let studentSkills = ['Java 21', 'Spring Boot 3', 'MySQL', 'REST APIs', 'Docker', 'Git'];
    let completedLessonsCount = 0;

    if (session) {
      const studentId = Number(session.sub);
      const lcRows = await query<any[]>(
        `SELECT COUNT(DISTINCT item_id) as cnt FROM lesson_completions WHERE student_id = ?`,
        [studentId]
      );
      completedLessonsCount = Number(lcRows[0]?.cnt || 0);

      if (completedLessonsCount > 10) {
        studentSkills.push('Microservices', 'Apache Kafka', 'Redis Cache', 'AWS Cloud');
      }
      if (completedLessonsCount > 25) {
        studentSkills.push('Google Gemini AI', 'RAG Architecture', 'System Design', 'Kubernetes (K8s)');
      }
    }

    const matchingSkills = jobTech.filter((skill) =>
      studentSkills.some((s) => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase()))
    );

    const missingSkills = jobTech.filter((skill) => !matchingSkills.includes(skill));

    const baseScore = 70;
    const skillBonus = jobTech.length > 0 ? Math.round((matchingSkills.length / jobTech.length) * 25) : 20;
    const progressBonus = Math.min(Math.round(completedLessonsCount * 0.5), 10);
    const matchScore = Math.min(baseScore + skillBonus + progressBonus, 98);

    let readinessLevel = 'High Referral Probability';
    if (matchScore < 75) readinessLevel = 'Recommended Preparation Track';
    else if (matchScore < 85) readinessLevel = 'Good Candidate Match';

    return NextResponse.json({
      success: true,
      jobId: job.id,
      company: job.company_name,
      role: job.role_title,
      matchScore,
      readinessLevel,
      matchingSkills: matchingSkills.length > 0 ? matchingSkills : ['Core Engineering', 'Problem Solving'],
      missingSkills: missingSkills.slice(0, 3),
      recommendation:
        missingSkills.length > 0
          ? `Review ${missingSkills[0]} in Cohort Modules to reach a 98% placement score.`
          : 'Profile is fully aligned for mentor referral fast-tracking.',
    });
  } catch (error: any) {
    console.error('[/api/jobs/ai-match GET]', error);
    return NextResponse.json({ success: false, message: 'Failed to calculate fit score' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const body = await request.json();
    const { jobId, companyName, roleTitle, enrolledTrack, pitchNotes } = body;

    const studentName = session?.name || 'Candidate';
    const trackName = enrolledTrack || 'Java Full Stack & Distributed Systems Engineering';

    const prompt = `You are a Senior Tech Placement Director and Mentor at Education Algorithm Institute of Software Engineering.
Write a compelling, professional 2-3 paragraph employee referral pitch for a student named "${studentName}" who is applying for the role of "${roleTitle || 'Software Development Engineer'}" at "${companyName || 'Top Indian Tech Company'}".

Context:
- Student Track: ${trackName}
- Core Skills: Java 21, Spring Boot 3 Microservices, Docker, AWS Cloud, Kafka, Redis, GenAI RAG, Clean Architecture.
- Student Notes: ${pitchNotes || 'Consistent top coder in LeetCode style challenges, completed end-to-end full-stack capstones.'}

Instructions:
1. Write in a confident, professional, hiring-ready tone.
2. Highlight their verified hands-on capstone engineering experience, clean code discipline, and architectural foundations.
3. Keep it crisp (150-200 words), ready to be sent directly to the engineering hiring manager or recruiter on LinkedIn/Instahyre.
4. Return ONLY the drafted pitch text without conversational filler.`;

    let generatedPitch = '';
    try {
      const aiRes = await callGeminiWithRotation({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
      });
      generatedPitch = aiRes?.text?.trim() || '';
    } catch {
      // Fallback template
      generatedPitch = `I am pleased to refer ${studentName} for the ${roleTitle} position at ${companyName}. As a graduate of our intensive ${trackName} cohort at Education Algorithm, ${studentName} has demonstrated exceptional software engineering discipline, mastering Java 21, Spring Boot microservices, containerization with Docker, and distributed cloud architectures.

During their coursework, ${studentName} architected production-ready distributed systems and passed rigorous real-time sandbox evaluations with high code quality standards. Their strong foundation in algorithmic problem-solving and proactive teamwork makes them a high-impact addition to the ${companyName} engineering team.`;
    }

    return NextResponse.json({
      success: true,
      pitch: generatedPitch,
    });
  } catch (error: any) {
    console.error('[/api/jobs/ai-match POST]', error);
    return NextResponse.json({ success: false, message: 'Failed to generate referral pitch' }, { status: 500 });
  }
}
