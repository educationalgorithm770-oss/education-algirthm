import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const studentId = session?.sub ? parseInt(session.sub, 10) : 1;
    const { searchParams } = new URL(request.url);
    const trackSlug = searchParams.get('trackSlug') || '30-day-pro';

    // 1. Fetch all available tracks
    const allTracks = await query<any[]>('SELECT * FROM aptitude_roadmaps ORDER BY duration_days ASC');
    const tracks = allTracks.map(t => ({
      trackSlug: t.track_slug,
      title: t.title,
      durationDays: t.duration_days,
      targetAudience: t.target_audience,
      badgeName: t.badge_name,
      xpReward: t.xp_reward,
      curriculum: typeof t.curriculum_json === 'string' ? JSON.parse(t.curriculum_json) : (t.curriculum_json || [])
    }));

    // 2. Fetch current active track curriculum
    const selectedTrack = tracks.find(t => t.trackSlug === trackSlug) || tracks[1] || tracks[0];

    // 3. Fetch student's progress on this track
    const progressRows = await query<any[]>(
      'SELECT * FROM aptitude_student_roadmap_nodes WHERE student_id = ? AND track_slug = ?',
      [studentId, trackSlug]
    );

    const progressMap = new Map<number, any>();
    progressRows.forEach(r => progressMap.set(r.day_number, r));

    // Calculate completed count and build node tree
    let completedDaysCount = 0;
    const daysTree = selectedTrack.curriculum.map((dayItem: any, idx: number) => {
      const dayNum = dayItem.day || (idx + 1);
      const studentNode = progressMap.get(dayNum);

      let status: 'LOCKED' | 'AVAILABLE' | 'COMPLETED' = 'LOCKED';
      if (studentNode) {
        status = studentNode.status;
      } else if (dayNum === 1 || progressMap.get(dayNum - 1)?.status === 'COMPLETED') {
        status = 'AVAILABLE';
      }

      if (status === 'COMPLETED') {
        completedDaysCount++;
      }

      return {
        ...dayItem,
        dayNumber: dayNum,
        status,
        scorePercentage: studentNode?.score_percentage || 0,
        completedAt: studentNode?.completed_at || null
      };
    });

    const completionPercentage = Math.round((completedDaysCount / selectedTrack.durationDays) * 100);

    return NextResponse.json({
      success: true,
      tracks: tracks.map(t => ({
        trackSlug: t.trackSlug,
        title: t.title,
        durationDays: t.durationDays,
        targetAudience: t.targetAudience,
        badgeName: t.badgeName,
        xpReward: t.xpReward
      })),
      activeTrack: {
        trackSlug: selectedTrack.trackSlug,
        title: selectedTrack.title,
        durationDays: selectedTrack.durationDays,
        targetAudience: selectedTrack.targetAudience,
        badgeName: selectedTrack.badgeName,
        xpReward: selectedTrack.xpReward,
        completedDaysCount,
        completionPercentage,
        days: daysTree
      }
    });

  } catch (error: any) {
    console.error('[/api/aptitude/roadmap GET] error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch roadmap', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const studentId = session?.sub ? parseInt(session.sub, 10) : 1;
    const body = await request.json();
    const { trackSlug, dayNumber, scorePercentage = 100 } = body;

    if (!trackSlug || !dayNumber) {
      return NextResponse.json(
        { success: false, message: 'trackSlug and dayNumber are required' },
        { status: 400 }
      );
    }

    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await execute(
      `INSERT INTO aptitude_student_roadmap_nodes (student_id, track_slug, day_number, status, score_percentage, completed_at)
       VALUES (?, ?, ?, 'COMPLETED', ?, ?)
       ON DUPLICATE KEY UPDATE 
         status = 'COMPLETED',
         score_percentage = VALUES(score_percentage),
         completed_at = VALUES(completed_at)`,
      [studentId, trackSlug, dayNumber, scorePercentage, nowStr]
    );

    // Also award +50 XP for day completion
    await execute(
      `UPDATE aptitude_student_stats 
       SET xp = xp + 50, last_active_date = CURDATE() 
       WHERE student_id = ?`,
      [studentId]
    );

    return NextResponse.json({
      success: true,
      message: `Day ${dayNumber} completed successfully! +50 XP awarded.`,
      dayNumber,
      status: 'COMPLETED'
    });

  } catch (error: any) {
    console.error('[/api/aptitude/roadmap POST] error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to complete roadmap day', error: error.message },
      { status: 500 }
    );
  }
}
