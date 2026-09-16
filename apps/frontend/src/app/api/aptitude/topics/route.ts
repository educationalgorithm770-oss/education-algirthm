import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const studentId = session?.sub ? parseInt(session.sub, 10) : null;

    // Fetch topics with question counts
    const topicsSql = `
      SELECT 
        t.id,
        t.slug,
        t.title,
        t.category,
        t.icon,
        t.color,
        t.difficulty_mix,
        t.summary,
        t.cheat_sheet,
        COUNT(q.id) AS total_questions
      FROM aptitude_topics t
      LEFT JOIN aptitude_questions q ON t.id = q.topic_id
      GROUP BY t.id
      ORDER BY t.category ASC, t.id ASC
    `;
    const rawTopics = await query<any[]>(topicsSql);

    // Fetch student topic mastery and stats if logged in
    let studentStats: any = null;
    let attemptsSummary: Record<number, { attempts: number; avg_score: number }> = {};

    if (studentId) {
      const statsRows = await query<any[]>(
        'SELECT * FROM aptitude_student_stats WHERE student_id = ?',
        [studentId]
      );
      if (statsRows.length > 0) {
        studentStats = statsRows[0];
      }

      const attemptRows = await query<any[]>(
        `SELECT topic_id, COUNT(*) as attempts, AVG(score_percentage) as avg_score 
         FROM aptitude_attempts 
         WHERE student_id = ? AND topic_id IS NOT NULL 
         GROUP BY topic_id`,
        [studentId]
      );
      attemptRows.forEach(r => {
        attemptsSummary[r.topic_id] = {
          attempts: Number(r.attempts),
          avg_score: Math.round(Number(r.avg_score) || 0)
        };
      });
    }

    // Format topics with cheat sheets and student progress
    const topics = rawTopics.map(t => {
      let cheatSheet = [];
      let diffMix = {};
      try {
        cheatSheet = typeof t.cheat_sheet === 'string' ? JSON.parse(t.cheat_sheet) : (t.cheat_sheet || []);
      } catch (e) {
        cheatSheet = [];
      }
      try {
        diffMix = typeof t.difficulty_mix === 'string' ? JSON.parse(t.difficulty_mix) : (t.difficulty_mix || {});
      } catch (e) {
        diffMix = {};
      }

      const studentProg = attemptsSummary[t.id] || { attempts: 0, avg_score: 0 };

      return {
        id: t.id,
        slug: t.slug,
        title: t.title,
        category: t.category,
        icon: t.icon,
        color: t.color || 'indigo',
        difficultyMix: diffMix,
        summary: t.summary,
        cheatSheet,
        totalQuestions: Number(t.total_questions) || 0,
        attempts: studentProg.attempts,
        masteryPercentage: studentProg.avg_score
      };
    });

    // Also fetch mock exams list
    const mockExamsRaw = await query<any[]>('SELECT * FROM aptitude_mock_exams ORDER BY id ASC');
    const mockExams = mockExamsRaw.map(m => {
      let cutoffs = {};
      try {
        cutoffs = typeof m.sectional_cutoffs === 'string' ? JSON.parse(m.sectional_cutoffs) : (m.sectional_cutoffs || {});
      } catch (e) {
        cutoffs = {};
      }
      return {
        id: m.id,
        slug: m.slug,
        title: m.title,
        company: m.company,
        badgeLogo: m.badge_logo,
        durationMinutes: m.duration_minutes,
        totalQuestions: m.total_questions,
        sectionalCutoffs: cutoffs
      };
    });

    return NextResponse.json({
      success: true,
      topics,
      mockExams,
      studentStats: studentStats ? {
        xp: studentStats.xp,
        brainGems: studentStats.brain_gems,
        streakDays: studentStats.streak_days,
        level: studentStats.level,
        currentTitle: studentStats.current_title,
        avatarCosmetic: studentStats.avatar_cosmetic,
        unlockedBadges: typeof studentStats.unlocked_badges === 'string' 
          ? JSON.parse(studentStats.unlocked_badges) 
          : (studentStats.unlocked_badges || []),
        lastSpinDate: studentStats.last_spin_date
      } : null
    });

  } catch (error: any) {
    console.error('[/api/aptitude/topics] error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load aptitude topics', error: error.message },
      { status: 500 }
    );
  }
}
