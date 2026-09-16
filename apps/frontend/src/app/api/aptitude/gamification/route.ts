import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const studentId = session?.sub ? parseInt(session.sub, 10) : 1; // Default demo student if unauthenticated

    let rows = await query<any[]>(
      'SELECT * FROM aptitude_student_stats WHERE student_id = ?',
      [studentId]
    );

    const todayStr = new Date().toISOString().split('T')[0];

    if (rows.length === 0) {
      // Initialize student stats
      await execute(
        `INSERT INTO aptitude_student_stats 
         (student_id, xp, brain_gems, streak_days, last_active_date, level, current_title, avatar_cosmetic, unlocked_badges, topic_mastery)
         VALUES (?, 120, 25, 1, ?, 1, 'Math Novice', 'algobot_rookie', '["FIRST_SPARK"]', '{}')`,
        [studentId, todayStr]
      );
      rows = await query<any[]>('SELECT * FROM aptitude_student_stats WHERE student_id = ?', [studentId]);
    }

    const stats = rows[0];
    const canSpinToday = stats.last_spin_date !== todayStr;

    let unlockedBadges = [];
    try {
      unlockedBadges = typeof stats.unlocked_badges === 'string' 
        ? JSON.parse(stats.unlocked_badges) 
        : (stats.unlocked_badges || []);
    } catch (e) {
      unlockedBadges = ['FIRST_SPARK'];
    }

    return NextResponse.json({
      success: true,
      stats: {
        studentId: stats.student_id,
        xp: stats.xp,
        brainGems: stats.brain_gems,
        streakDays: stats.streak_days,
        level: stats.level,
        currentTitle: stats.current_title,
        avatarCosmetic: stats.avatar_cosmetic,
        unlockedBadges,
        canSpinToday,
        lastSpinDate: stats.last_spin_date
      }
    });

  } catch (error: any) {
    console.error('[/api/aptitude/gamification] error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve gamification stats', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const studentId = session?.sub ? parseInt(session.sub, 10) : 1;
    const body = await request.json();
    const action = body.action;

    const todayStr = new Date().toISOString().split('T')[0];

    // Ensure student record exists
    let rows = await query<any[]>('SELECT * FROM aptitude_student_stats WHERE student_id = ?', [studentId]);
    if (rows.length === 0) {
      await execute(
        `INSERT INTO aptitude_student_stats 
         (student_id, xp, brain_gems, streak_days, last_active_date, level, current_title, avatar_cosmetic, unlocked_badges, topic_mastery)
         VALUES (?, 120, 25, 1, ?, 1, 'Math Novice', 'algobot_rookie', '["FIRST_SPARK"]', '{}')`,
        [studentId, todayStr]
      );
      rows = await query<any[]>('SELECT * FROM aptitude_student_stats WHERE student_id = ?', [studentId]);
    }
    const currentStats = rows[0];

    if (action === 'DAILY_SPIN') {
      if (currentStats.last_spin_date === todayStr) {
        return NextResponse.json({
          success: false,
          message: 'You have already spun the Lucky Wheel today! Come back tomorrow.'
        }, { status: 400 });
      }

      // Wheel options
      const rewards = [
        { label: '+50 XP', xp: 50, gems: 0, index: 0 },
        { label: '+10 Brain Gems', xp: 0, gems: 10, index: 1 },
        { label: '+100 XP Supercharge', xp: 100, gems: 0, index: 2 },
        { label: '+25 Brain Gems Mega', xp: 0, gems: 25, index: 3 },
        { label: '+150 XP Mastery Boost', xp: 150, gems: 5, index: 4 },
        { label: '+50 Brain Gems Jackpot', xp: 50, gems: 50, index: 5 }
      ];

      const winningSlice = rewards[Math.floor(Math.random() * rewards.length)];

      const newXp = currentStats.xp + winningSlice.xp;
      const newGems = currentStats.brain_gems + winningSlice.gems;
      const newLevel = Math.max(1, Math.floor(newXp / 250) + 1);

      await execute(
        `UPDATE aptitude_student_stats 
         SET xp = ?, brain_gems = ?, level = ?, last_spin_date = ?, last_active_date = ? 
         WHERE student_id = ?`,
        [newXp, newGems, newLevel, todayStr, todayStr, studentId]
      );

      return NextResponse.json({
        success: true,
        reward: winningSlice,
        newStats: {
          xp: newXp,
          brainGems: newGems,
          level: newLevel,
          streakDays: currentStats.streak_days
        }
      });
    }

    if (action === 'EQUIP_AVATAR') {
      const { avatarCosmetic } = body;
      if (!avatarCosmetic) {
        return NextResponse.json({ success: false, message: 'Avatar cosmetic is required' }, { status: 400 });
      }

      await execute(
        'UPDATE aptitude_student_stats SET avatar_cosmetic = ? WHERE student_id = ?',
        [avatarCosmetic, studentId]
      );

      return NextResponse.json({
        success: true,
        message: 'Avatar updated successfully',
        avatarCosmetic
      });
    }

    return NextResponse.json({ success: false, message: 'Unknown gamification action' }, { status: 400 });

  } catch (error: any) {
    console.error('[/api/aptitude/gamification POST] error:', error);
    return NextResponse.json(
      { success: false, message: 'Gamification action failed', error: error.message },
      { status: 500 }
    );
  }
}
