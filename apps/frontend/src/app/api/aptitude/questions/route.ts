import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicSlug = searchParams.get('topicSlug');
    const companySlug = searchParams.get('companySlug');
    const mode = searchParams.get('mode') || 'PRACTICE'; // 'PRACTICE' | 'TIMED_DRILL' | 'MOCK_EXAM' | 'SPEED_DUEL'
    const difficulty = searchParams.get('difficulty');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    let sql = `
      SELECT 
        q.id,
        q.topic_id,
        t.title AS topic_title,
        t.slug AS topic_slug,
        t.category AS topic_category,
        q.title,
        q.story_hook,
        q.question_text,
        q.options,
        q.correct_option,
        q.difficulty,
        q.tags,
        q.shortcut_trick,
        q.detailed_solution,
        q.explanation_diagram,
        q.time_limit_seconds,
        q.xp_reward
      FROM aptitude_questions q
      JOIN aptitude_topics t ON q.topic_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (topicSlug) {
      sql += ' AND t.slug = ?';
      params.push(topicSlug);
    }

    if (difficulty) {
      sql += ' AND q.difficulty = ?';
      params.push(difficulty.toUpperCase());
    }

    if (mode === 'SPEED_DUEL') {
      // For speed duel, randomize and take 5 fast questions (Quant & Logic)
      sql += ' ORDER BY RAND() LIMIT ?';
      params.push(5);
    } else if (companySlug) {
      // For mock exam, match company tag or return diverse sample
      sql += ' ORDER BY RAND() LIMIT ?';
      params.push(limit);
    } else {
      sql += ' ORDER BY q.id ASC LIMIT ?';
      params.push(limit);
    }

    const rows = await query<any[]>(sql, params);

    const questions = rows.map(q => {
      let options = [];
      let tags = [];
      try {
        options = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
      } catch (e) {
        options = [];
      }
      try {
        tags = typeof q.tags === 'string' ? JSON.parse(q.tags) : (q.tags || []);
      } catch (e) {
        tags = [];
      }

      return {
        id: q.id,
        topicId: q.topic_id,
        topicTitle: q.topic_title,
        topicSlug: q.topic_slug,
        category: q.topic_category,
        title: q.title,
        storyHook: q.story_hook,
        questionText: q.question_text,
        options,
        // In practice mode, we can include correct_option and solutions so client can reveal immediately upon answering.
        // In Timed Drill / Mock Exam, client receives answers on submission.
        correctOption: q.correct_option,
        difficulty: q.difficulty,
        tags,
        shortcutTrick: q.shortcut_trick,
        detailedSolution: q.detailed_solution,
        timeLimitSeconds: q.time_limit_seconds || 60,
        xpReward: q.xp_reward || 20
      };
    });

    return NextResponse.json({
      success: true,
      mode,
      total: questions.length,
      questions
    });

  } catch (error: any) {
    console.error('[/api/aptitude/questions] error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch aptitude questions', error: error.message },
      { status: 500 }
    );
  }
}
