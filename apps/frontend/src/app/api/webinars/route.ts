import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

function sanitizeMeetingUrl(url: string | null | undefined): string {
  if (!url) return 'https://meet.google.com';
  let clean = url.trim();
  const doubleProtocolMatch = clean.match(/(https?:\/\/[^\/]+)\/(https?:\/\/.+)/i);
  if (doubleProtocolMatch && doubleProtocolMatch[2]) {
    clean = doubleProtocolMatch[2];
  }
  clean = clean.replace(/^https?:\/\/meet\.google\.com\/(https?:\/\/)/i, '$1');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  return clean;
}

export async function GET() {
  try {
    const rows = await query<RowDataPacket[]>(
      `SELECT 
        lc.id,
        lc.course_id,
        lc.title,
        lc.instructor_name,
        lc.meet_link,
        lc.scheduled_at,
        lc.duration_minutes,
        lc.status,
        lc.created_at,
        c.title AS course_title,
        c.slug AS course_slug,
        c.level AS course_level,
        i.title AS instructor_title,
        i.avatar_url AS instructor_avatar
      FROM live_classes lc
      LEFT JOIN courses c ON lc.course_id = c.id
      LEFT JOIN instructors i ON CONVERT(lc.instructor_name USING utf8mb4) = CONVERT(i.name USING utf8mb4)
      ORDER BY 
        CASE 
          WHEN lc.status = 'live' THEN 1
          WHEN lc.status = 'upcoming' AND lc.scheduled_at >= NOW() THEN 2
          WHEN lc.status = 'upcoming' THEN 3
          ELSE 4
        END ASC,
        lc.scheduled_at ASC`
    );

    const now = new Date();
    const mapped = rows.map((r) => {
      const scheduledDate = r.scheduled_at ? new Date(r.scheduled_at) : null;
      const isPast = scheduledDate ? scheduledDate.getTime() < now.getTime() - (r.duration_minutes || 60) * 60 * 1000 : false;
      const effectiveStatus = r.status === 'live' ? 'live' : (isPast && r.status !== 'upcoming' ? 'completed' : r.status || 'upcoming');

      return {
        id: `web_${r.id}`,
        rawId: r.id,
        title: r.title,
        courseId: r.course_id,
        courseTitle: r.course_title || 'Enterprise Engineering Track',
        courseSlug: r.course_slug || 'java-fullstack-system-design',
        courseLevel: r.course_level || 'Intermediate to Advanced',
        speaker: r.instructor_name || 'Senior Principal Architect',
        speakerRole: r.instructor_title || 'Lead FAANG System Architect',
        speakerAvatar: r.instructor_avatar || null,
        meetLink: sanitizeMeetingUrl(r.meet_link),
        scheduledAt: r.scheduled_at ? new Date(r.scheduled_at).toISOString() : null,
        duration: `${r.duration_minutes || 60} mins`,
        status: effectiveStatus,
        isLive: effectiveStatus === 'live',
        category: r.course_title || 'System Design & AI',
        date: scheduledDate ? scheduledDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Upcoming Date',
        time: scheduledDate ? scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) + ' IST' : '7:00 PM IST',
        registrationOpen: effectiveStatus !== 'completed' && effectiveStatus !== 'cancelled',
      };
    });

    // Find closest upcoming / live session for the top countdown timer
    const upcomingSessions = mapped.filter((w) => w.status === 'live' || (w.status === 'upcoming' && w.scheduledAt && new Date(w.scheduledAt) > now));
    const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : (mapped.length > 0 ? mapped[0] : null);

    return NextResponse.json({
      success: true,
      webinars: mapped,
      nextSession,
      totalCount: mapped.length,
    });
  } catch (error: any) {
    console.error('API /api/webinars GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, webinarId, webinarTitle, courseId } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Name and email address are required.' }, { status: 400 });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = phone ? String(phone).trim() : 'N/A';
    const cleanWebinar = webinarTitle ? String(webinarTitle).trim() : 'Live Engineering Masterclass';
    const cId = Number(courseId) || 1;

    // 1. Record lead in CRM
    await execute(
      `INSERT INTO crm_leads (name, email, phone, course_id, source, status, notes, created_at)
       VALUES (?, ?, ?, ?, 'webinar_landing', 'new', ?, NOW())`,
      [cleanName, cleanEmail, cleanPhone, cId, `Reserved seat for webinar: ${cleanWebinar} (ID: ${webinarId || 'N/A'})`]
    );

    // 2. Record in contact_messages for notifications
    await execute(
      `INSERT INTO contact_messages (name, email, phone, message, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [cleanName, cleanEmail, cleanPhone, `Webinar Seat Reservation: ${cleanWebinar}. Attendee contact: ${cleanPhone}`]
    );

    const reservationCode = 'WB-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    return NextResponse.json({
      success: true,
      message: `Your seat has been reserved! Confirmation & calendar invite sent to ${cleanEmail}.`,
      reservationCode,
      webinar: cleanWebinar,
    });
  } catch (error: any) {
    console.error('API /api/webinars POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
