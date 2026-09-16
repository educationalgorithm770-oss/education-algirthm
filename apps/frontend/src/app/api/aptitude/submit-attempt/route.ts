import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

interface AnswerSubmission {
  questionId: number;
  selectedOption: string;
  timeSpentSeconds?: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const studentId = session?.sub ? parseInt(session.sub, 10) : 1;
    const body = await request.json();

    const {
      topicId,
      mockExamId,
      mode = 'PRACTICE',
      submissions = [],
      totalTimeSeconds = 0
    } = body as {
      topicId?: number;
      mockExamId?: number;
      mode: 'PRACTICE' | 'TIMED_DRILL' | 'MOCK_EXAM' | 'SPEED_DUEL';
      submissions: AnswerSubmission[];
      totalTimeSeconds: number;
    };

    if (!submissions || submissions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No question answers submitted' },
        { status: 400 }
      );
    }

    const questionIds = submissions.map(s => s.questionId);
    // Fetch actual correct answers from DB
    const questionsDb = await query<any[]>(
      `SELECT id, correct_option, xp_reward, difficulty, shortcut_trick, detailed_solution 
       FROM aptitude_questions 
       WHERE id IN (${questionIds.map(() => '?').join(',')})`,
      questionIds
    );

    const questionMap = new Map<number, any>();
    questionsDb.forEach(q => questionMap.set(q.id, q));

    let correctCount = 0;
    let wrongCount = 0;
    let totalXpEarned = 0;
    const answersLog: any[] = [];

    submissions.forEach(sub => {
      const q = questionMap.get(sub.questionId);
      if (!q) return;

      const isCorrect = sub.selectedOption && sub.selectedOption.toUpperCase() === q.correct_option.toUpperCase();
      if (isCorrect) {
        correctCount++;
        totalXpEarned += Number(q.xp_reward) || 20;
      } else {
        wrongCount++;
      }

      answersLog.push({
        questionId: sub.questionId,
        selectedOption: sub.selectedOption,
        correctOption: q.correct_option,
        isCorrect,
        timeSpent: sub.timeSpentSeconds || 0,
        shortcutTrick: q.shortcut_trick,
        detailedSolution: q.detailed_solution
      });
    });

    const totalQuestions = submissions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100 * 100) / 100;

    // Bonus Brain Gems for high accuracy
    let gemsEarned = 0;
    if (scorePercentage >= 80) gemsEarned += 10;
    if (scorePercentage === 100) gemsEarned += 15;
    if (mode === 'SPEED_DUEL' && scorePercentage >= 60) gemsEarned += 5;

    // 1. Insert attempt into aptitude_attempts
    await execute(
      `INSERT INTO aptitude_attempts 
       (student_id, topic_id, mock_exam_id, mode, total_questions, correct_answers, wrong_answers, score_percentage, time_taken_seconds, xp_earned, gems_earned, answers_log)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        topicId || null,
        mockExamId || null,
        mode,
        totalQuestions,
        correctCount,
        wrongCount,
        scorePercentage,
        totalTimeSeconds,
        totalXpEarned,
        gemsEarned,
        JSON.stringify(answersLog)
      ]
    );

    // 2. Update Student Stats (XP, Gems, Streak, Badges)
    const todayStr = new Date().toISOString().split('T')[0];
    let statsRows = await query<any[]>('SELECT * FROM aptitude_student_stats WHERE student_id = ?', [studentId]);
    
    let currentXp = 0;
    let currentGems = 0;
    let streakDays = 1;
    let unlockedBadges: string[] = [];

    if (statsRows.length === 0) {
      currentXp = totalXpEarned;
      currentGems = gemsEarned;
      unlockedBadges = ['FIRST_SPARK'];
    } else {
      const stats = statsRows[0];
      currentXp = stats.xp + totalXpEarned;
      currentGems = stats.brain_gems + gemsEarned;
      streakDays = stats.streak_days;

      try {
        unlockedBadges = typeof stats.unlocked_badges === 'string' ? JSON.parse(stats.unlocked_badges) : (stats.unlocked_badges || []);
      } catch (e) {
        unlockedBadges = [];
      }

      // Check streak update
      if (stats.last_active_date) {
        const lastDate = new Date(stats.last_active_date);
        const today = new Date(todayStr);
        const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          streakDays += 1;
        } else if (diffDays > 1) {
          streakDays = 1;
        }
      }
    }

    // Check newly unlocked badges
    const newBadges: string[] = [];
    if (!unlockedBadges.includes('FIRST_SPARK')) {
      newBadges.push('FIRST_SPARK');
      unlockedBadges.push('FIRST_SPARK');
    }
    if (scorePercentage === 100 && !unlockedBadges.includes('PERFECT_CENTURY')) {
      newBadges.push('PERFECT_CENTURY');
      unlockedBadges.push('PERFECT_CENTURY');
    }
    if (streakDays >= 3 && !unlockedBadges.includes('STREAK_3')) {
      newBadges.push('STREAK_3');
      unlockedBadges.push('STREAK_3');
    }
    if (mode === 'SPEED_DUEL' && scorePercentage >= 80 && !unlockedBadges.includes('SPEED_DEMON')) {
      newBadges.push('SPEED_DEMON');
      unlockedBadges.push('SPEED_DEMON');
    }
    if (mockExamId && scorePercentage >= 70 && !unlockedBadges.includes('OA_CRUSHER')) {
      newBadges.push('OA_CRUSHER');
      unlockedBadges.push('OA_CRUSHER');
    }

    const newLevel = Math.max(1, Math.floor(currentXp / 250) + 1);
    let title = 'Math Novice';
    if (newLevel >= 5) title = 'Logic Grandmaster';
    else if (newLevel >= 4) title = 'Aptitude Prodigy';
    else if (newLevel >= 3) title = 'Speed Ninja';
    else if (newLevel >= 2) title = 'Sharp Thinker';

    if (statsRows.length === 0) {
      await execute(
        `INSERT INTO aptitude_student_stats 
         (student_id, xp, brain_gems, streak_days, last_active_date, level, current_title, avatar_cosmetic, unlocked_badges, topic_mastery)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'algobot_rookie', ?, '{}')`,
        [studentId, currentXp, currentGems, streakDays, todayStr, newLevel, title, JSON.stringify(unlockedBadges)]
      );
    } else {
      await execute(
        `UPDATE aptitude_student_stats 
         SET xp = ?, brain_gems = ?, streak_days = ?, last_active_date = ?, level = ?, current_title = ?, unlocked_badges = ?
         WHERE student_id = ?`,
        [currentXp, currentGems, streakDays, todayStr, newLevel, title, JSON.stringify(unlockedBadges), studentId]
      );
    }

    return NextResponse.json({
      success: true,
      results: {
        totalQuestions,
        correctCount,
        wrongCount,
        scorePercentage,
        totalTimeSeconds,
        xpEarned: totalXpEarned,
        gemsEarned,
        newStats: {
          xp: currentXp,
          brainGems: currentGems,
          streakDays,
          level: newLevel,
          currentTitle: title,
          unlockedBadges
        },
        newBadges,
        answersLog
      }
    });

  } catch (error: any) {
    console.error('[/api/aptitude/submit-attempt] error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to evaluate attempt', error: error.message },
      { status: 500 }
    );
  }
}
