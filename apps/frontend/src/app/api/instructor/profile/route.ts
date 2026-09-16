import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized faculty session.' }, { status: 401 });
    }

    const instructorId = Number(session.sub) || 1;

    const rows = await query<RowDataPacket[]>(
      'SELECT id, name, email, phone, title, bio, linkedin_url, github_url, avatar_url FROM instructors WHERE id = ? LIMIT 1',
      [instructorId]
    );

    const inst = rows[0] || {
      id: instructorId,
      name: session.name || 'Lead Faculty',
      email: session.email || 'faculty@educationalgorithm.com',
      phone: '+91 98765 43210',
      title: 'Senior Java & AI Systems Engineer',
      bio: 'Senior Technical Instructor specializing in Distributed Systems, Full-Stack Architecture, and Generative AI.',
      linkedin_url: 'https://linkedin.com',
      github_url: 'https://github.com',
    };

    return NextResponse.json({
      success: true,
      profile: {
        id: inst.id,
        name: inst.name,
        email: inst.email,
        phone: inst.phone || '+91 98765 43210',
        title: inst.title || 'Senior Technical Instructor',
        bio: inst.bio || 'Senior Technical Instructor specializing in Distributed Systems, Full-Stack Architecture, and Generative AI.',
        specialization: inst.title || 'Java 21, Spring Boot 3, Microservices, LangChain',
        linkedIn: inst.linkedin_url || 'https://linkedin.com',
        github: inst.github_url || 'https://github.com',
        avatarUrl: inst.avatar_url,
      },
    });
  } catch (error: any) {
    console.error('API /api/instructor/profile GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized faculty session.' }, { status: 401 });
    }

    const instructorId = Number(session.sub) || 1;
    const body = await request.json();
    const { name, phone, title, bio, linkedIn, github } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required.' }, { status: 400 });
    }

    await execute(
      `UPDATE instructors 
       SET name = ?, phone = ?, title = ?, bio = ?, linkedin_url = ?, github_url = ? 
       WHERE id = ?`,
      [name.trim(), phone?.trim() || null, title?.trim() || null, bio?.trim() || null, linkedIn?.trim() || null, github?.trim() || null, instructorId]
    );

    return NextResponse.json({
      success: true,
      message: 'Instructor profile updated successfully in live database.',
    });
  } catch (error: any) {
    console.error('API /api/instructor/profile PATCH Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
