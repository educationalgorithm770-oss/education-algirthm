import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

interface CertLookupRow extends RowDataPacket {
  id: number;
  certificate_code: string;
  student_id: number;
  course_id: number;
  student_name: string;
  course_title: string;
  instructor_name: string;
  issue_date: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim() || searchParams.get('code')?.trim() || '';
    const hash = searchParams.get('hash')?.trim() || '';

    if (!id && !hash) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: 'Please provide a certificate ID or cryptographic hash to verify.',
      }, { status: 400 });
    }

    let certRows: CertLookupRow[] = [];

    if (id) {
      certRows = await query<CertLookupRow[]>(
        `SELECT id, certificate_code, student_id, student_name, course_id, course_title, instructor_name, issue_date 
         FROM course_certificates WHERE certificate_code = ? LIMIT 1`,
        [id]
      );
    }

    const primarySecret = process.env.CERT_SIGNING_SECRET || process.env.JWT_SECRET || 'ea_cert_secret_2026';
    const legacySecret = 'ea_cert_secret_2026';

    // If searched by hash or ID wasn't found, try matching by hash
    if (certRows.length === 0 && hash) {
      const allCerts = await query<CertLookupRow[]>(
        `SELECT id, certificate_code, student_id, student_name, course_id, course_title, instructor_name, issue_date 
         FROM course_certificates ORDER BY id DESC LIMIT 100`
      );
      for (const c of allCerts) {
        const computedHash = crypto
          .createHmac('sha256', primarySecret)
          .update(`${c.student_id}:${c.course_id}:${c.certificate_code}`)
          .digest('hex');
        const legacyHash = crypto
          .createHmac('sha256', legacySecret)
          .update(`${c.student_id}:${c.course_id}:${c.certificate_code}`)
          .digest('hex');
        if (computedHash === hash || legacyHash === hash) {
          certRows = [c];
          break;
        }
      }
    }

    if (certRows.length === 0) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: 'No verified credential was found matching the provided identifier.',
      });
    }

    const c = certRows[0];
    const hashDigest = crypto
      .createHmac('sha256', primarySecret)
      .update(`${c.student_id}:${c.course_id}:${c.certificate_code}`)
      .digest('hex');

    return NextResponse.json({
      success: true,
      valid: true,
      certificate: {
        certificateId: c.certificate_code,
        studentName: c.student_name,
        courseName: c.course_title,
        instructor: c.instructor_name || 'Dr. Arvind Sharma',
        issuedDate: new Date(c.issue_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        hash: hashDigest,
        status: 'VERIFIED & VALID',
        institution: 'Education Algorithm Institute of Software Engineering',
        skills: ['Full Stack Architecture', 'Applied AI & GenAI', 'Cloud Systems & DevOps', 'Algorithm Optimization'],
      },
    });
  } catch (error: any) {
    console.error('[/api/certificates/verify]', error);
    return NextResponse.json({ success: false, valid: false, message: 'Verification lookup error' }, { status: 500 });
  }
}
