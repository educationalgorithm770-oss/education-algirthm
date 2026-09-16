import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const studentId = session ? Number(session.sub) : null;
    const isStudent = session?.role === 'student';

    let courseClause = '';
    let params: any[] = [];

    if (isStudent && studentId) {
      const enrollments = await query<RowDataPacket[]>(
        'SELECT course_id FROM enrollments WHERE student_id = ? AND status = "active"',
        [studentId]
      );
      if (enrollments.length > 0) {
        const enrolledCourseIds = enrollments.map(e => e.course_id);
        courseClause = `WHERE m.course_id IN (${enrolledCourseIds.join(',')})`;
      }
    }

    const quizzes = await query<RowDataPacket[]>(
      `SELECT q.id, q.module_id, q.title, q.time_limit_minutes, q.pass_percent, q.created_at,
              COALESCE(c.id, 1) AS course_id,
              COALESCE(c.title, 'General Engineering') AS course_title,
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
      `SELECT id, quiz_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, sort_order
       FROM quiz_questions
       WHERE quiz_id IN (${quizIdList})
       ORDER BY id ASC`
    );

    let pastAttempts: any[] = [];
    if (studentId) {
      const attemptRows = await query<RowDataPacket[]>(
        `SELECT qa.id, qa.quiz_id, qa.score, qa.total_questions, qa.passed, qa.submitted_at,
                q.title AS quiz_title, c.title AS course_title
         FROM quiz_attempts qa
         LEFT JOIN quizzes q ON qa.quiz_id = q.id
         LEFT JOIN modules m ON q.module_id = m.id
         LEFT JOIN courses c ON m.course_id = c.id
         WHERE qa.student_id = ?
         ORDER BY qa.submitted_at DESC
         LIMIT 20`,
        [studentId]
      );
      pastAttempts = attemptRows.map(a => ({
        id: `ATT-${a.id}`,
        quizId: a.quiz_id,
        topic: a.quiz_title || 'General Quiz',
        course: a.course_title || 'Engineering Track',
        score: a.score,
        total: a.total_questions,
        percentage: a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0,
        passed: Boolean(a.passed),
        date: new Date(a.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      }));
    }

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
        questions: qQuestions.map((quest, idx) => {
          const opts = [quest.option_a, quest.option_b, quest.option_c, quest.option_d].filter(Boolean);
          return {
            id: `q_${quest.id || idx}`,
            question: quest.question,
            options: opts.length > 0 ? opts : ['Option A', 'Option B', 'Option C', 'Option D'],
            explanation: `Review core architecture principles in ${q.title} to understand why this option is correct.`,
            distractorReason: 'Other choices do not satisfy the required production criteria.',
            practicalTakeaway: `Key engineering standard tested in ${q.title}.`,
            followUpQuestion: 'How would you apply this in production?',
            followUpAnswer: 'By following system design best practices and automated testing.',
          };
        }),
      };
    });

    return NextResponse.json({
      success: true,
      quizzes: formattedQuizzes,
      pastAttempts,
    });
  } catch (error: any) {
    console.error('API /api/student/quizzes GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.sub) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to submit quiz attempts.' },
        { status: 401 }
      );
    }

    const studentId = Number(session.sub);
    const body = await request.json();
    const { quizId, score, totalQuestions, passed, answers } = body;

    const rawQuizId = typeof quizId === 'string' ? parseInt(quizId.replace(/^Q-/, ''), 10) : Number(quizId);

    // Calculate score server-side if question answers are submitted
    let calculatedScore = Number(score) || 0;
    let calculatedTotal = Number(totalQuestions) || 1;
    let isPassed = Boolean(passed);

    if (rawQuizId && answers && typeof answers === 'object') {
      const dbQuestions = await query<RowDataPacket[]>(
        'SELECT id, correct_option FROM quiz_questions WHERE quiz_id = ? ORDER BY id ASC',
        [rawQuizId]
      );

      if (dbQuestions.length > 0) {
        calculatedTotal = dbQuestions.length;
        calculatedScore = 0;
        dbQuestions.forEach((q, idx) => {
          const cLetter = (q.correct_option || 'a').toLowerCase();
          const correctIdx = cLetter === 'a' ? 0 : cLetter === 'b' ? 1 : cLetter === 'c' ? 2 : 3;
          const studentAns = answers[idx] ?? answers[q.id];
          if (studentAns === correctIdx) {
            calculatedScore++;
          }
        });

        const quizRows = await query<RowDataPacket[]>('SELECT pass_percent FROM quizzes WHERE id = ? LIMIT 1', [rawQuizId]);
        const passPercent = quizRows[0]?.pass_percent || 80;
        const studentPercentage = (calculatedScore / calculatedTotal) * 100;
        isPassed = studentPercentage >= passPercent;
      }
    }

    const result = await execute(
      `INSERT INTO quiz_attempts (student_id, quiz_id, score, total_questions, passed, submitted_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [studentId, rawQuizId || 1, calculatedScore, calculatedTotal, isPassed ? 1 : 0]
    );

    return NextResponse.json({
      success: true,
      message: 'Quiz attempt recorded in database successfully.',
      attemptId: result.insertId,
      score: calculatedScore,
      totalQuestions: calculatedTotal,
      passed: isPassed,
    });
  } catch (error: any) {
    console.error('API /api/student/quizzes POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}