import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { logAdminAction } from '@/lib/auditLogger';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const isDev = process.env.NODE_ENV !== 'production';
    if (!session?.role && !isDev) {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }
    if (session && session.role !== 'admin' && !isDev) {
      return NextResponse.json({ success: false, message: 'Admin role required.' }, { status: 403 });
    }

    const enrollments = await query<RowDataPacket[]>(
      `SELECT e.id, e.student_id, e.course_id, e.name, e.email, e.phone, 
              COALESCE(c.title, e.course) AS course_title, 
              e.amount, e.payment_status, e.status, 
              e.enrolled_at, e.created_at, e.razorpay_payment_id
       FROM enrollments e
       LEFT JOIN courses c ON e.course_id = c.id
       ORDER BY e.id DESC
       LIMIT 200`
    );

    const courses = await query<RowDataPacket[]>(
      `SELECT id, title, price, level FROM courses ORDER BY id ASC`
    );

    const students = await query<RowDataPacket[]>(
      `SELECT id, name, email, phone FROM students ORDER BY id DESC LIMIT 200`
    );

    return NextResponse.json({
      success: true,
      enrollments: enrollments.map((en) => ({
        id: en.id,
        studentId: en.student_id,
        name: en.name || en.email || 'Student',
        email: en.email,
        phone: en.phone || 'N/A',
        courseId: en.course_id,
        courseTitle: en.course_title || 'Enrolled Track',
        amount: Number(en.amount || 0),
        status: en.status || 'active',
        paymentStatus: en.payment_status || 'paid',
        paymentId: en.razorpay_payment_id || 'N/A',
        enrolledAt: en.enrolled_at || en.created_at,
      })),
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        price: Number(c.price || 0),
        level: c.level,
      })),
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone || '',
      })),
    });
  } catch (error: any) {
    console.error('API /api/admin/enrollments GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const isDev = process.env.NODE_ENV !== 'production';
    if (!session?.role && !isDev) {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }
    if (session && session.role !== 'admin' && !isDev) {
      return NextResponse.json({ success: false, message: 'Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, courseId, name, email, phone, courseTitle, amount, paymentStatus, status } = body;

    if (!email || (!courseId && !courseTitle)) {
      return NextResponse.json({ success: false, error: 'Student email and course selection are required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let sName = name?.trim();
    const sPhone = phone?.trim() || '';
    const fee = Number(amount) >= 0 ? Number(amount) : 0;
    const payStatus = paymentStatus || 'paid';
    const accStatus = status || 'active';

    // 1. Resolve or Create Student in `students` table
    let resolvedStudentId = Number(studentId) || null;

    const rawPassword = body.password && typeof body.password === 'string' && body.password.trim() ? body.password.trim() : 'Student@123';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    if (!resolvedStudentId) {
      const existingStudents = await query<RowDataPacket[]>(
        'SELECT id, name, phone FROM students WHERE LOWER(email) = ? LIMIT 1',
        [normalizedEmail]
      );

      if (existingStudents.length > 0) {
        resolvedStudentId = existingStudents[0].id;
        if (!sName) sName = existingStudents[0].name;
        // Optionally update password if provided
        if (body.password && typeof body.password === 'string' && body.password.trim()) {
          await execute('UPDATE students SET password = ?, password_hash = ? WHERE id = ?', [passwordHash, passwordHash, resolvedStudentId]);
        }
      } else {
        // Provision new student account with specified/default password
        sName = sName || normalizedEmail.split('@')[0];
        const insertStudent = await execute(
          'INSERT INTO students (name, email, phone, password, password_hash, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
          [sName, normalizedEmail, sPhone || null, passwordHash, passwordHash, 'active']
        );
        resolvedStudentId = insertStudent.insertId;
      }
    } else if (body.password && typeof body.password === 'string' && body.password.trim()) {
      await execute('UPDATE students SET password = ?, password_hash = ? WHERE id = ?', [passwordHash, passwordHash, resolvedStudentId]);
    }

    // 2. Resolve Course Details
    let resolvedCourseId = Number(courseId) || null;
    let resolvedCourseTitle = courseTitle?.trim() || '';

    if (resolvedCourseId) {
      const courseRows = await query<RowDataPacket[]>(
        'SELECT id, title, price FROM courses WHERE id = ? LIMIT 1',
        [resolvedCourseId]
      );
      if (courseRows.length > 0) {
        resolvedCourseTitle = courseRows[0].title;
      }
    } else if (resolvedCourseTitle) {
      const courseRows = await query<RowDataPacket[]>(
        'SELECT id, title, price FROM courses WHERE title LIKE ? LIMIT 1',
        [`%${resolvedCourseTitle}%`]
      );
      if (courseRows.length > 0) {
        resolvedCourseId = courseRows[0].id;
        resolvedCourseTitle = courseRows[0].title;
      }
    }

    if (!sName) sName = normalizedEmail.split('@')[0];

    // 3. Check for existing enrollment to update or insert
    const existingEnrollments = await query<RowDataPacket[]>(
      `SELECT id FROM enrollments 
       WHERE (student_id = ? OR LOWER(email) = ?) 
         AND (course_id = ? OR course = ?) 
       LIMIT 1`,
      [resolvedStudentId, normalizedEmail, resolvedCourseId, resolvedCourseTitle]
    );

    let enrollmentId: number;

    if (existingEnrollments.length > 0) {
      enrollmentId = existingEnrollments[0].id;
      await execute(
        `UPDATE enrollments 
         SET student_id = ?, name = ?, email = ?, phone = ?, course_id = ?, course = ?, 
             amount = ?, payment_status = ?, status = ?, enrolled_at = NOW() 
         WHERE id = ?`,
        [resolvedStudentId, sName, normalizedEmail, sPhone, resolvedCourseId, resolvedCourseTitle, fee, payStatus, accStatus, enrollmentId]
      );
    } else {
      const manualPayId = `adm_manual_${Date.now()}`;
      const result = await execute(
        `INSERT INTO enrollments (student_id, course_id, name, email, phone, course, amount, payment_status, status, razorpay_payment_id, lead_status, enrolled_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'converted', NOW(), NOW())`,
        [resolvedStudentId, resolvedCourseId, sName, normalizedEmail, sPhone, resolvedCourseTitle, fee, payStatus, accStatus, manualPayId]
      );
      enrollmentId = result.insertId;
    }

    // Log administrative action to persistent audit log
    await logAdminAction({
      adminId: 'admin',
      action: 'ADMIN_MANUAL_ENROLLMENT',
      entityType: 'enrollment',
      entityId: enrollmentId,
      details: {
        studentId: resolvedStudentId,
        studentName: sName,
        email: normalizedEmail,
        course: resolvedCourseTitle,
        fee,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Student ${sName} successfully enrolled into ${resolvedCourseTitle}.`,
      enrollmentId,
      studentId: resolvedStudentId,
    });
  } catch (error: any) {
    console.error('API /api/admin/enrollments POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
