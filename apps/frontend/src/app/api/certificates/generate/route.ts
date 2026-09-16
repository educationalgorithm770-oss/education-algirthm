import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { getSessionFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

const GenerateCertSchema = z.object({
  courseId: z.union([z.number(), z.string().transform((val) => parseInt(val, 10))]),
});

interface EnrolledCheckRow extends RowDataPacket {
  id: number;
  status: string;
}

interface ProgressRow extends RowDataPacket {
  total: number;
  done: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to generate certificates.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = GenerateCertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Valid course ID is required.' },
        { status: 400 }
      );
    }

    const { courseId } = parsed.data;
    const studentId = Number(session.sub);
    const studentName = session.name || 'Verified Student';

    // 1. Verify Active Paid Enrollment
    const enrollment = await query<EnrolledCheckRow[]>(
      `SELECT id, status FROM enrollments 
       WHERE student_id = ? AND (course_id = ? OR course = (SELECT title FROM courses WHERE id = ?))
         AND status IN ('active', 'ENROLLED', 'completed')
       LIMIT 1`,
      [studentId, courseId, courseId]
    );

    if (enrollment.length === 0) {
      return NextResponse.json(
        { success: false, error: 'You are not actively enrolled in this course.' },
        { status: 403 }
      );
    }

    // 2. Verify 100% Progress Completion
    const progressRows = await query<ProgressRow[]>(
      `SELECT
         (SELECT COUNT(*) FROM videos v
          JOIN modules m ON v.module_id = m.id
          WHERE m.course_id = ?) AS total,
         (SELECT COUNT(DISTINCT lc.item_id) FROM lesson_completions lc
          JOIN videos v2 ON lc.item_id = v2.id
          JOIN modules m2 ON v2.module_id = m2.id
          WHERE m2.course_id = ? AND lc.student_id = ?) AS done`,
      [courseId, courseId, studentId]
    );

    const total = Number(progressRows[0]?.total || 0);
    const done = Number(progressRows[0]?.done || 0);
    const isCompleted = total > 0 && done >= total;

    if (!isCompleted) {
      return NextResponse.json(
        { success: false, error: `Course completion required (${done}/${total} lessons completed).` },
        { status: 400 }
      );
    }

    // 3. Resolve course title
    const courseRows = await query<RowDataPacket[]>('SELECT title FROM courses WHERE id = ? LIMIT 1', [courseId]);
    const courseTitle = courseRows[0]?.title || 'Masterclass';

    const issueDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const certCode = `EA-${crypto.randomBytes(6).toString('hex').toUpperCase()}-2026`;
    const secret = process.env.CERT_SIGNING_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json({
        success: false,
        error: 'Certificate signing service configuration error: Secret key missing',
      }, { status: 500 });
    }
    const hashDigest = crypto
      .createHmac('sha256', secret)
      .update(`${studentId}:${courseId}:${certCode}`)
      .digest('hex');

    // Check if certificate already exists in DB
    const existing = await query<RowDataPacket[]>(
      'SELECT certificate_code, issue_date FROM course_certificates WHERE student_id = ? AND course_id = ? LIMIT 1',
      [studentId, courseId]
    );

    let finalCertCode = certCode;
    let finalIssueDate = issueDate;

    if (existing.length > 0) {
      finalCertCode = existing[0].certificate_code;
      finalIssueDate = new Date(existing[0].issue_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } else {
      await query(
        `INSERT INTO course_certificates 
           (certificate_code, student_id, course_id, student_name, course_title, instructor_name, issue_date)
         VALUES (?, ?, ?, ?, ?, 'Dr. Arvind Sharma', NOW())`,
        [finalCertCode, studentId, courseId, studentName, courseTitle]
      );
    }

    const finalHash = crypto
      .createHmac('sha256', secret)
      .update(`${studentId}:${courseId}:${finalCertCode}`)
      .digest('hex');

    return NextResponse.json({
      success: true,
      certificate: {
        certificateId: finalCertCode,
        studentId: String(studentId),
        studentName,
        courseId: String(courseId),
        courseName: courseTitle,
        issuedDate: finalIssueDate,
        hash: finalHash,
        verificationUrl: `/verify-certificate?id=${finalCertCode}`,
        status: 'VERIFIED & VALID',
      },
    });
  } catch (error: any) {
    console.error('API /api/certificates/generate POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Certificate generation failed', details: error?.message },
      { status: 500 }
    );
  }
}
