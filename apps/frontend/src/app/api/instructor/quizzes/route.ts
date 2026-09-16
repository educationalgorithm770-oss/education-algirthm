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
    const isAdmin = session.role === 'admin';

    let courseClause = '';
    let params: any[] = [];

    if (!isAdmin) {
      courseClause = `WHERE m.course_id IN (SELECT course_id FROM course_instructors WHERE instructor_id = ?)`;
      params = [instructorId];
    }

    const quizzes = await query<RowDataPacket[]>(
      `SELECT q.id, q.module_id, q.title, q.time_limit_minutes, q.pass_percent, q.created_at,
              COALESCE(c.title, 'General Track') AS course_title,
              COALESCE(m.title, 'Core Module') AS module_title
       FROM quizzes q
       LEFT JOIN modules m ON q.module_id = m.id
       LEFT JOIN courses c ON m.course_id = c.id
       ${courseClause}
       ORDER BY q.id DESC`,
      params
    );

    const quizIds = quizzes.map((q) => q.id);
    const quizIdList = quizIds.length > 0 ? quizIds.join(',') : '0';

    const questions = await query<RowDataPacket[]>(
      `SELECT id, quiz_id, question, option_a, option_b, option_c, option_d, correct_option 
       FROM quiz_questions 
       WHERE quiz_id IN (${quizIdList}) 
       ORDER BY id ASC`
    );

    const formattedQuizzes = quizzes.map((q) => ({
      id: `IQ-${q.id}`,
      rawId: q.id,
      title: q.title,
      course: q.course_title,
      module: q.module_title,
      passingScore: q.pass_percent || 80,
      timeLimitMins: q.time_limit_minutes || 20,
      isPublished: true,
      questions: questions
        .filter((quest) => quest.quiz_id === q.id)
        .map((quest) => {
          const opts = [quest.option_a, quest.option_b, quest.option_c, quest.option_d].filter(Boolean);
          const correctIdx = quest.correct_option?.toLowerCase() === 'a' ? 0 
            : quest.correct_option?.toLowerCase() === 'b' ? 1 
            : quest.correct_option?.toLowerCase() === 'c' ? 2 
            : 3;
          return {
            id: `QST-${quest.id}`,
            rawId: quest.id,
            text: quest.question,
            options: opts.length > 0 ? opts : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctIndex: correctIdx >= 0 ? correctIdx : 0,
            correctOption: quest.correct_option?.toUpperCase() || 'A',
          };
        }),
    }));

    return NextResponse.json({
      success: true,
      quizzes: formattedQuizzes,
    });
  } catch (error: any) {
    console.error('API /api/instructor/quizzes GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized faculty session.' }, { status: 401 });
    }

    const body = await request.json();
    const { action, quizId, title, courseId, passingScore, timeLimitMins, questions, newQuestion } = body;

    // Action 1: Add a single question to an existing quiz
    if (action === 'add_question') {
      const rawQuizId = typeof quizId === 'string' ? parseInt(quizId.replace(/^IQ-/, ''), 10) : Number(quizId);
      if (!rawQuizId || !newQuestion?.text) {
        return NextResponse.json({ success: false, error: 'Quiz ID and question text are required.' }, { status: 400 });
      }

      const opts = newQuestion.options || ['Option A', 'Option B', 'Option C', 'Option D'];
      const optKeys = ['a', 'b', 'c', 'd'];
      const correctLetter = optKeys[newQuestion.correctIndex || 0] || 'a';

      const qResult = await execute(
        `INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'medium', 1)`,
        [rawQuizId, newQuestion.text.trim(), opts[0] || '', opts[1] || '', opts[2] || '', opts[3] || '', correctLetter]
      );

      return NextResponse.json({
        success: true,
        message: 'Question added to quiz successfully.',
        questionId: qResult.insertId,
      });
    }

    // Action 2: Create a brand new quiz with questions
    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Quiz title is required.' }, { status: 400 });
    }

    const targetCourseId = Number(courseId) || 1;
    const modRows = await query<RowDataPacket[]>(
      'SELECT id FROM modules WHERE course_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1',
      [targetCourseId]
    );
    let moduleId = modRows[0]?.id;
    if (!moduleId) {
      const anyMod = await query<RowDataPacket[]>('SELECT id FROM modules ORDER BY id ASC LIMIT 1');
      moduleId = anyMod[0]?.id;
    }

    const quizResult = await execute(
      `INSERT INTO quizzes (module_id, title, time_limit_minutes, pass_percent, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [moduleId, title.trim(), parseInt(timeLimitMins) || 20, parseInt(passingScore) || 80]
    );

    const newQuizId = quizResult.insertId;

    if (Array.isArray(questions) && questions.length > 0) {
      for (const q of questions) {
        if (!q.text || !q.text.trim()) continue;
        const optionKeys = ['a', 'b', 'c', 'd'];
        const correctLetter = optionKeys[q.correctIndex || 0] || 'a';
        await execute(
          `INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'medium', 1)`,
          [newQuizId, q.text.trim(), q.options?.[0] || 'Option A', q.options?.[1] || 'Option B', q.options?.[2] || 'Option C', q.options?.[3] || 'Option D', correctLetter]
        );
      }
    } else {
      // Default initial question if none provided
      await execute(
        `INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, 'a', 'medium', 1)`,
        [newQuizId, `Core concept assessment on ${title.trim()}`, 'Primary Architecture Layer', 'Secondary Processing Queue', 'Distributed Consensus Node', 'Failover Cluster',]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz created successfully with questions.',
      quizId: `IQ-${newQuizId}`,
    });
  } catch (error: any) {
    console.error('API /api/instructor/quizzes POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized faculty session.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');
    const questionId = searchParams.get('questionId');

    if (questionId) {
      const rawQId = parseInt(questionId.replace(/^QST-/, ''), 10);
      await execute('DELETE FROM quiz_questions WHERE id = ?', [rawQId]);
      return NextResponse.json({ success: true, message: 'Question deleted successfully.' });
    }

    if (quizId) {
      const rawQuizId = parseInt(quizId.replace(/^IQ-/, ''), 10);
      await execute('DELETE FROM quiz_questions WHERE quiz_id = ?', [rawQuizId]);
      await execute('DELETE FROM quizzes WHERE id = ?', [rawQuizId]);
      return NextResponse.json({ success: true, message: 'Quiz deleted successfully.' });
    }

    return NextResponse.json({ success: false, error: 'No quiz or question specified for deletion.' }, { status: 400 });
  } catch (error: any) {
    console.error('API /api/instructor/quizzes DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
