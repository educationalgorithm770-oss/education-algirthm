import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';
import crypto from 'crypto';

interface EnrolledCourseRow extends RowDataPacket {
  course_id: number;
  course_title: string;
  course_slug?: string;
  enrolled_at: string;
}

interface ProgressRow extends RowDataPacket {
  total: number;
  done: number;
}

interface CertRow extends RowDataPacket {
  id: number;
  certificate_code: string;
  student_name: string;
  course_title: string;
  instructor_name: string;
  issue_date: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const studentId = Number(session.sub);

    // 1. Get enrolled courses for this student
    const enrolledCourses = await query<EnrolledCourseRow[]>(
      `SELECT DISTINCT c.id AS course_id, c.title AS course_title, e.created_at AS enrolled_at
       FROM enrollments e
       JOIN courses c ON (e.course_id = c.id OR e.course = c.title)
       WHERE e.student_id = ? AND e.status IN ('active', 'ENROLLED', 'completed')
       ORDER BY e.created_at DESC`,
      [studentId]
    );

    const coursesList = enrolledCourses;
    const courseCertificates = [];

    for (const course of coursesList) {
      const courseId = course.course_id;

      // 2. Count total lessons & completed lessons
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
      const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
      const isCompleted = percentage >= 100 && total > 0;

      let certificate = null;

      if (isCompleted) {
        // Check if certificate exists in database
        const existingCert = await query<CertRow[]>(
          `SELECT * FROM course_certificates WHERE student_id = ? AND course_id = ? LIMIT 1`,
          [studentId, courseId]
        );

        const secret = process.env.CERT_SIGNING_SECRET || process.env.JWT_SECRET || 'ea_cert_secret_2026';

        if (existingCert.length > 0) {
          const c = existingCert[0];
          const hash = crypto
            .createHmac('sha256', secret)
            .update(`${studentId}:${courseId}:${c.certificate_code}`)
            .digest('hex');

          certificate = {
            certificateCode: c.certificate_code,
            studentName: c.student_name || session.name,
            courseTitle: c.course_title,
            instructorName: c.instructor_name || 'Dr. Arvind Sharma',
            issueDate: new Date(c.issue_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            hash,
            verificationUrl: `/verify-certificate?id=${c.certificate_code}`,
          };
        } else {
          // Issue new verified certificate
          const certCode = `EA-${crypto.randomBytes(6).toString('hex').toUpperCase()}-2026`;
          const studentName = session.name || 'Verified Student';
          const courseTitle = course.course_title;
          const instructorName = 'Dr. Arvind Sharma';

          await execute(
            `INSERT INTO course_certificates (certificate_code, student_id, course_id, student_name, course_title, instructor_name, issue_date)
             VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
            [certCode, studentId, courseId, studentName, courseTitle, instructorName]
          );

          const hash = crypto
            .createHmac('sha256', secret)
            .update(`${studentId}:${courseId}:${certCode}`)
            .digest('hex');

          certificate = {
            certificateCode: certCode,
            studentName,
            courseTitle,
            instructorName,
            issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            hash,
            verificationUrl: `/verify-certificate?id=${certCode}`,
          };
        }
      } else {
        // If not 100% completed, ensure any premature certificate row is cleaned up
        await execute(
          `DELETE FROM course_certificates WHERE student_id = ? AND course_id = ?`,
          [studentId, courseId]
        );
      }

      courseCertificates.push({
        courseId,
        courseTitle: course.course_title,
        totalLessons: total,
        completedLessons: done,
        percentage,
        isCompleted,
        certificate,
      });
    }

    return NextResponse.json({
      success: true,
      student: {
        id: studentId,
        name: session.name,
        email: session.email,
      },
      courses: courseCertificates,
    });
  } catch (error: any) {
    console.error('[/api/student/certificates]', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch certificate status' }, { status: 500 });
  }
}
