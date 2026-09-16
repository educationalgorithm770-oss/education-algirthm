import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== 'admin' && session.role !== 'instructor')) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin session.' }, { status: 401 });
    }

    const quizzes = await query<RowDataPacket[]>(
      `SELECT q.id, q.module_id, q.title, q.time_limit_minutes, q.pass_percent, q.created_at,
              COALESCE(c.id, 1) AS course_id,
              COALESCE(c.title, 'General Track') AS course_title,
              COALESCE(m.title, 'Core Module') AS module_title
       FROM quizzes q
       LEFT JOIN modules m ON q.module_id = m.id
       LEFT JOIN courses c ON m.course_id = c.id
       ORDER BY q.id DESC`
    );

    const quizIds = quizzes.map((q) => q.id);
    const quizIdList = quizIds.length > 0 ? quizIds.join(',') : '0';

    const questions = await query<RowDataPacket[]>(
      `SELECT id, quiz_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, sort_order
       FROM quiz_questions
       WHERE quiz_id IN (${quizIdList})
       ORDER BY id ASC`
    );

    const formattedQuizzes = quizzes.map((q) => {
      const qQuestions = questions.filter((quest) => quest.quiz_id === q.id);
      return {
        id: `Q-${q.id}`,
        rawId: q.id,
        title: q.title,
        courseId: q.course_id,
        course: q.course_title,
        module: q.module_title,
        questionsCount: qQuestions.length > 0 ? qQuestions.length : 5,
        passingScore: `${q.pass_percent || 80}%`,
        passingPercent: q.pass_percent || 80,
        timeLimit: `${q.time_limit_minutes || 20} mins`,
        timeLimitMinutes: q.time_limit_minutes || 20,
        isPublished: true,
        createdAt: q.created_at,
        questions: qQuestions.map((quest, idx) => {
          const opts = [quest.option_a, quest.option_b, quest.option_c, quest.option_d].filter(Boolean);
          const cLetter = (quest.correct_option || 'a').toLowerCase();
          const correctIdx = cLetter === 'a' ? 0 : cLetter === 'b' ? 1 : cLetter === 'c' ? 2 : 3;
          return {
            id: `QST-${quest.id || idx}`,
            rawId: quest.id,
            question: quest.question,
            options: opts.length > 0 ? opts : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: correctIdx >= 0 ? correctIdx : 0,
            correctOption: (quest.correct_option || 'A').toUpperCase(),
          };
        }),
      };
    });

    return NextResponse.json({
      success: true,
      quizzes: formattedQuizzes,
    });
  } catch (error: any) {
    console.error('API /api/admin/quizzes GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== 'admin' && session.role !== 'instructor')) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin session.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, course, courseId, moduleId: inputModuleId, passingScore, timeLimit, timeLimitMinutes, questions } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Quiz title is required.' }, { status: 400 });
    }

    // 1. Resolve valid course ID
    let targetCourseId = Number(courseId);
    if (!targetCourseId && course) {
      const cRows = await query<RowDataPacket[]>('SELECT id FROM courses WHERE title LIKE ? LIMIT 1', [`%${course.trim()}%`]);
      if (cRows.length > 0) targetCourseId = cRows[0].id;
    }
    if (!targetCourseId) {
      const firstCourse = await query<RowDataPacket[]>('SELECT id FROM courses ORDER BY id ASC LIMIT 1');
      targetCourseId = firstCourse[0]?.id || 1;
    }

    // 2. Resolve valid module ID (guaranteed valid foreign key reference)
    let moduleId: number | null = null;
    if (inputModuleId) {
      const explicitMod = await query<RowDataPacket[]>('SELECT id FROM modules WHERE id = ? LIMIT 1', [Number(inputModuleId)]);
      if (explicitMod.length > 0) moduleId = explicitMod[0].id;
    }

    if (!moduleId) {
      const modRows = await query<RowDataPacket[]>('SELECT id FROM modules WHERE course_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1', [targetCourseId]);
      if (modRows.length > 0) {
        moduleId = modRows[0].id;
      } else {
        const anyMod = await query<RowDataPacket[]>('SELECT id FROM modules ORDER BY id ASC LIMIT 1');
        if (anyMod.length > 0) {
          moduleId = anyMod[0].id;
        } else {
          const newMod = await execute(
            'INSERT INTO modules (course_id, title, sort_order) VALUES (?, ?, 1)',
            [targetCourseId, 'Core Curriculum & Assessments']
          );
          moduleId = newMod.insertId;
        }
      }
    }

    const parsedPass = parseInt(String(passingScore || '80').replace('%', ''), 10) || 80;
    const parsedTime = parseInt(String(timeLimitMinutes || timeLimit || '20').replace(/[^0-9]/g, ''), 10) || 20;

    const quizResult = await execute(
      `INSERT INTO quizzes (module_id, title, time_limit_minutes, pass_percent, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [moduleId, title.trim(), parsedTime, parsedPass]
    );

    const newQuizId = quizResult.insertId;

    if (Array.isArray(questions) && questions.length > 0) {
      for (const q of questions) {
        const qText = q.question || q.text || '';
        if (!qText.trim()) continue;
        const opts = q.options || ['Option A', 'Option B', 'Option C', 'Option D'];
        const optionKeys = ['a', 'b', 'c', 'd'];
        const correctLetter = optionKeys[q.correctAnswer ?? q.correctIndex ?? 0] || 'a';
        await execute(
          `INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'medium', 1)`,
          [newQuizId, qText.trim(), opts[0] || '', opts[1] || '', opts[2] || '', opts[3] || '', correctLetter]
        );
      }
    } else {
      await execute(
        `INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, 'a', 'medium', 1)`,
        [newQuizId, `Core concept assessment on ${title.trim()}`, 'Primary Architecture Layer', 'Secondary Processing Queue', 'Distributed Consensus Node', 'Failover Cluster']
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin quiz published to MySQL and Student LMS successfully.',
      quizId: `Q-${newQuizId}`,
    });
  } catch (error: any) {
    console.error('API /api/admin/quizzes POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized admin session.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');

    if (!quizId) {
      return NextResponse.json({ success: false, error: 'Quiz ID is required for deletion.' }, { status: 400 });
    }

    const rawQuizId = parseInt(quizId.replace(/^Q-/, ''), 10);
    await execute('DELETE FROM quiz_questions WHERE quiz_id = ?', [rawQuizId]);
    await execute('DELETE FROM quizzes WHERE id = ?', [rawQuizId]);

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted from MySQL successfully.',
    });
  } catch (error: any) {
    console.error('API /api/admin/quizzes DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}