'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface VideoLesson {
  id: number;
  title: string;
  duration: string;
  bunny_video_id?: string | null;
  youtube_id?: string | null;
  video_url?: string | null;
  file_path?: string | null;
  completed?: boolean;
}

interface CourseModule {
  id: number;
  title: string;
  description: string;
  videos: VideoLesson[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  modules: CourseModule[];
}

interface AIChatMessage {
  id: string;
  sender: 'student' | 'ai';
  text: string;
  timestamp: string;
}

const STARTER_CODE_TEMPLATES: Record<string, string> = {
  javascript: `// Interactive JavaScript Code Arena
function solveChallenge() {
  const cohort = "Educationalgorithm";
  const status = "Active Student";
  console.log(\`⚡ Welcome to \${cohort} LMS!\`);
  console.log(\`🎓 Status: \${status}\`);
  
  // Try writing your solution here:
  const numbers = [10, 20, 30, 40, 50];
  const total = numbers.reduce((acc, curr) => acc + curr, 0);
  console.log("Calculated Sum:", total);
}

solveChallenge();`,
  python: `# Interactive Python Code Arena
def analyze_data():
    course = "Java & Full Stack Development"
    modules = 12
    print(f"🚀 Course: {course}")
    print(f"📦 Total Modules: {modules}")
    
    # Practice logic:
    squares = [x**2 for x in range(1, 6)]
    print("Computed Squares:", squares)

analyze_data()`,
  java: `// Interactive Java Code Arena
public class Main {
    public static void main(String[] args) {
        String course = "Enterprise Java Architecture";
        int studentRoll = 9427;
        
        System.out.println("✅ Executing Java Virtual Machine Code...");
        System.out.println("🎓 Course: " + course);
        System.out.println("🆔 Roll Number: ROLL-" + studentRoll);
    }
}`,
  cpp: `// Interactive C++ Code Arena
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "⚡ C++ High-Performance Runtime\n";
    std::vector<int> scores = {95, 88, 100, 92};
    int sum = std::accumulate(scores.begin(), scores.end(), 0);
    std::cout << "Average Score: " << (sum / (double)scores.size()) << "\n";
    return 0;
}`,
  typescript: `// Interactive TypeScript Code Arena
interface StudentProfile {
  name: string;
  course: string;
  completedCredits: number;
}

const student: StudentProfile = {
  name: "Verified Student",
  course: "Full Stack Cloud Native",
  completedCredits: 100
};

console.log("⚡ TypeScript Type-Safe Execution");
console.log(\`Student: \${student.name} | Credits: \${student.completedCredits}%\`);`
};

export default function LessonPlayerPage({ params }: { params: { courseId: string } }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<VideoLesson | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<number>>(new Set());
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [activeTab, setActiveTab] = useState<'notes' | 'code' | 'ai-tutor' | 'quiz' | 'certificate' | 'doubts' | 'syllabus'>('notes');
  const [zenMode, setZenMode] = useState(false);
  const [studentName, setStudentName] = useState('Student');
  const [registrationNumber, setRegistrationNumber] = useState('EA-2026-9427');
  const [rollNumber, setRollNumber] = useState('ROLL-9427');

  // Doubt Desk State
  const [doubtText, setDoubtText] = useState('');
  const [doubtsList, setDoubtsList] = useState<{ id: string; user: string; text: string; time: string; status: string }[]>([]);

  // Code Arena State
  const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');
  const [sourceCode, setSourceCode] = useState<string>(STARTER_CODE_TEMPLATES.javascript);
  const [terminalOutput, setTerminalOutput] = useState<string>('Terminal Ready. Click "Run Code ▶" to execute.');
  const [isRunningCode, setIsRunningCode] = useState(false);

  // AI Tutor State
  const [aiChatMessages, setAiChatMessages] = useState<AIChatMessage[]>([
    {
      id: 'ai-init',
      sender: 'ai',
      text: `👋 Hello! I am your **24/7 AI Teaching Assistant** for this course. 

Feel free to ask me anything:
- 💡 Explain concepts or syntax from this video
- 🔍 Debug your code snippets
- 🎯 Top interview questions on this topic`,
      timestamp: 'Just now'
    }
  ]);
  const [aiInputPrompt, setAiInputPrompt] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Dynamic Quiz State
  const [activeQuiz, setActiveQuiz] = useState<{
    id: string;
    rawId: number;
    title: string;
    courseId: number;
    questions: Array<{
      id: string | number;
      question: string;
      options: string[];
      correct?: number;
      explanation?: string;
    }>;
  } | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizTotal, setQuizTotal] = useState<number | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '733405';

  useEffect(() => {
    async function loadCourseAndStudentData() {
      try {
        setLoading(true);

        // Fetch User Session for Name & Roll No
        try {
          const authRes = await fetch('/api/auth/me');
          const authData = await authRes.json();
          if (authData.success && authData.user) {
            if (authData.user.name) setStudentName(authData.user.name);
            if (authData.user.registration_number) setRegistrationNumber(authData.user.registration_number);
            if (authData.user.roll_number) setRollNumber(authData.user.roll_number);
          }
        } catch (_) {}

        // Fetch Course Content
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (data.success && Array.isArray(data.courses)) {
          const paramStr = decodeURIComponent(params.courseId || '').toLowerCase().trim();
          const numericId = parseInt(paramStr, 10);

          const found = data.courses.find((c: any) => {
            if (!isNaN(numericId) && c.id === numericId) return true;
            if (c.slug && (c.slug.toLowerCase() === paramStr || paramStr.includes(c.slug.toLowerCase()) || c.slug.toLowerCase().includes(paramStr))) return true;
            const titleLower = (c.title || '').toLowerCase();
            if (titleLower.includes(paramStr) || paramStr.includes(titleLower)) return true;
            if (paramStr.includes('java') && titleLower.includes('java')) return true;
            if (paramStr.includes('data') && titleLower.includes('data')) return true;
            if (paramStr.includes('devops') && titleLower.includes('devops')) return true;
            return false;
          }) || data.courses.find((c: any) => c.modules && c.modules.length > 0) || data.courses[0];

          setCourse(found);

          if (found && found.modules && found.modules.length > 0) {
            const firstModule = found.modules[0];
            if (firstModule.videos && firstModule.videos.length > 0) {
              setActiveLesson(firstModule.videos[0]);
            }
          }

          // Fetch Dynamic Quizzes for this Course
          try {
            const qRes = await fetch('/api/student/quizzes');
            const qData = await qRes.json();
            if (qData.success && Array.isArray(qData.quizzes) && qData.quizzes.length > 0) {
              const matched = qData.quizzes.find((q: any) =>
                (found && q.courseId === found.id) ||
                (found && q.course && found.title && q.course.toLowerCase().includes(found.title.toLowerCase())) ||
                (found && q.course && found.title && found.title.toLowerCase().includes(q.course.toLowerCase()))
              ) || qData.quizzes[0];

              if (matched && matched.questions && matched.questions.length > 0) {
                setActiveQuiz(matched);
              }
            }
          } catch (qErr) {
            console.error('Failed to load course quizzes:', qErr);
          }
        }
      } catch (err) {
        console.error('Failed to load lesson player course data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCourseAndStudentData();
  }, [params.courseId]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, activeLesson]);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setSourceCode(STARTER_CODE_TEMPLATES[lang] || '// Start coding here...');
    setTerminalOutput(`Switched environment to ${lang.toUpperCase()}. Click "Run Code ▶" to execute.`);
  };

  const handleRunCode = async () => {
    setIsRunningCode(true);
    setTerminalOutput('⏳ Compiling and executing source code in sandbox runtime...\n');

    try {
      const normalizedLang = selectedLanguage === 'typescript' ? 'javascript' : selectedLanguage;
      const res = await fetch('/api/sandbox/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: normalizedLang,
          code: sourceCode,
          mode: 'batch',
          stdin: '',
        }),
      });

      const data = await res.json();

      if (data.status === 'Accepted') {
        setTerminalOutput(
          `🚀 === EXECUTION OUTPUT (${selectedLanguage.toUpperCase()}) ===\n\n` +
          (data.stdout || '(Code executed successfully with 0 standard output messages.)') +
          `\n\n✨ Process finished with exit code 0 [Completed in ${data.executionTimeMs || 45}ms]`
        );
      } else if (data.status === 'Compilation Error') {
        setTerminalOutput(
          `❌ === COMPILATION ERROR (${selectedLanguage.toUpperCase()}) ===\n\n` +
          (data.compileError || data.stderr || 'Compilation failed.')
        );
      } else {
        setTerminalOutput(
          `⚠️ === ${data.status?.toUpperCase() || 'RUNTIME ERROR'} ===\n\n` +
          (data.runtimeError || data.stderr || data.stdout || 'Execution error occurred.')
        );
      }
    } catch (err: any) {
      setTerminalOutput(`❌ Execution Error:\n${err?.message || String(err)}`);
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleAskAI = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || aiInputPrompt;
    if (!promptToSend.trim()) return;

    const userMsg: AIChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'student',
      text: promptToSend.trim(),
      timestamp: 'Just now'
    };

    setAiChatMessages(prev => [...prev, userMsg]);
    if (!overridePrompt) setAiInputPrompt('');
    setIsAiThinking(true);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend.trim(),
          code: selectedLanguage === 'javascript' ? sourceCode : undefined,
          context: `${course?.title || 'Full Stack'} - Active Lesson: ${activeLesson?.title || 'Overview'}`
        })
      });

      const data = await res.json();
      const replyText = data.reply || data.message || 'I could not process that request. Please try again.';

      setAiChatMessages(prev => [
        ...prev,
        {
          id: 'ai_' + Date.now(),
          sender: 'ai',
          text: replyText,
          timestamp: 'Just now'
        }
      ]);
    } catch (err) {
      setAiChatMessages(prev => [
        ...prev,
        {
          id: 'ai_' + Date.now(),
          sender: 'ai',
          text: `⚠️ **AI Assistant Offline:** I could not reach the server. Please check your network connection.`,
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const toggleLessonCompletion = async (lessonId: number) => {
    const isCurrentlyCompleted = completedLessonIds.has(lessonId);
    const newCompleted = !isCurrentlyCompleted;

    setCompletedLessonIds((prev) => {
      const next = new Set(prev);
      if (newCompleted) next.add(lessonId);
      else next.delete(lessonId);
      return next;
    });

    try {
      await fetch('/api/progress/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course?.id ?? 1,
          lessonId,
          completed: newCompleted,
        }),
      });
    } catch (e) {
      console.error('Failed to toggle completion:', e);
    }
  };

  const handlePostDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtText.trim()) return;
    setDoubtsList((prev) => [
      {
        id: 'd_' + Date.now(),
        user: `${studentName} (You)`,
        text: doubtText.trim(),
        time: 'Just now',
        status: 'Submitted to Instructor Desk',
      },
      ...prev,
    ]);
    setDoubtText('');
  };

  // Sample Module Quiz Questions
  const sampleQuiz = [
    {
      id: 1,
      question: `What is the primary advantage of Virtual Threads introduced in Java 21?`,
      options: [
        'They map 1:1 with OS kernel threads to maximize memory consumption',
        'They are lightweight JVM-managed threads allowing millions of concurrent tasks with minimal memory footprint',
        'They replace all database queries with in-memory caching automatically',
        'They only work in multi-core supercomputers'
      ],
      correct: 1,
      explanation: 'Virtual threads map M:N onto carrier threads and unmount when blocking on I/O, allowing massive scalability without memory exhaustion.'
    },
    {
      id: 2,
      question: `Why must payment signatures (HMAC-SHA256) be verified on the backend server instead of the browser?`,
      options: [
        'To reduce internet bandwidth on mobile devices',
        'Because client-side verification can be bypassed or tampered with by malicious actors',
        'Because JavaScript does not support cryptography',
        'To speed up Razorpay webhook delivery'
      ],
      correct: 1,
      explanation: 'The Razorpay Key Secret must remain strictly confidential on the server. Validating on the backend guarantees payment authenticity.'
    },
    {
      id: 3,
      question: `What is the purpose of Idempotency checks during payment verification?`,
      options: [
        'To charge the student twice for premium membership',
        'To ensure retried or duplicate payment callbacks do not create duplicate enrollments or double-charge students',
        'To automatically delete old student accounts',
        'To convert currency from USD to INR'
      ],
      correct: 1,
      explanation: 'Idempotency guarantees that executing the same payment callback multiple times results in the same single enrollment state.'
    }
  ];

  const totalLessonsCount = course?.modules.reduce((acc, m) => acc + (m.videos?.length || 0), 0) || 1;
  const progressPercent = Math.round((completedLessonIds.size / totalLessonsCount) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-indigo-500"></i>
          <div className="text-sm font-medium">Loading interactive lesson player & classroom tools...</div>
        </div>
      </div>
    );
  }

  if (!course || !course.modules || course.modules.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <StudentNavbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md w-full text-center space-y-4">
            <i className="fa-solid fa-film text-4xl text-slate-300"></i>
            <h2 className="text-xl font-bold text-slate-900">No Lessons Found</h2>
            <p className="text-xs text-slate-500">This course does not have published video lessons yet.</p>
            <Link href="/dashboard" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md">
              Return to Student Dashboard
            </Link>
          </div>
        </main>
        <StudentFooter />
      </div>
    );
  }

  const isCompleted = activeLesson ? completedLessonIds.has(activeLesson.id) : false;

  // Determine video player source: YouTube vs BunnyCDN vs HTML5 Direct Stream
  const youtubeId = activeLesson?.youtube_id?.trim();
  const bunnyVideoId = activeLesson?.bunny_video_id?.trim();
  const rawFileUrl = activeLesson?.video_url?.trim() || activeLesson?.file_path?.trim();

  const isYouTube = Boolean(youtubeId && youtubeId.length >= 5 && youtubeId !== 'sample');
  const isBunny = Boolean(!isYouTube && bunnyVideoId && bunnyVideoId.length > 5 && bunnyVideoId !== 'sample' && !bunnyVideoId.includes('sample'));
  const isDirect = Boolean(!isYouTube && !isBunny && rawFileUrl && (rawFileUrl.startsWith('http') || rawFileUrl.endsWith('.mp4')) && !rawFileUrl.includes('/sample'));

  // Fallback direct URL if no valid stream ID is specified
  const directVideoUrl = isDirect ? rawFileUrl : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {!zenMode && <StudentNavbar />}

      {/* Navigation Header Bar */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-16 z-30 shadow-xs">
        <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0 flex-1 mr-2">
          <Link href="/dashboard" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0" title="Return to Dashboard">
            <i className="fa-solid fa-arrow-left text-xs sm:text-sm"></i>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-[10px] sm:text-xs text-indigo-600 font-bold uppercase tracking-wider truncate max-w-[120px] sm:max-w-none">
                {course.title}
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] sm:text-[10px] font-extrabold shrink-0">
                {progressPercent}% Complete
              </span>
            </div>
            <h1 className="text-xs sm:text-base font-extrabold text-slate-900 truncate">
              {activeLesson?.title || 'Select a lesson'}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          <button
            onClick={() => setZenMode(!zenMode)}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border ${
              zenMode
                ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={zenMode ? 'Exit Focus' : 'Zen Focus'}
          >
            <i className="fa-solid fa-compress text-xs"></i>
            <span className="hidden sm:inline">{zenMode ? 'Exit Focus' : 'Zen Focus'}</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center space-x-1.5 ${
              activeTab === 'code' ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title="Code Arena"
          >
            <i className={`fa-solid fa-code text-xs ${activeTab === 'code' ? 'text-white' : 'text-indigo-500'}`}></i>
            <span className="hidden sm:inline">Code Arena</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-tutor')}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center space-x-1.5 ${
              activeTab === 'ai-tutor' ? 'bg-purple-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title="AI Tutor"
          >
            <i className={`fa-solid fa-robot text-xs ${activeTab === 'ai-tutor' ? 'text-white' : 'text-purple-500'}`}></i>
            <span className="hidden sm:inline">AI Tutor</span>
          </button>

          <button
            onClick={() => setActiveTab('certificate')}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center space-x-1.5 ${
              activeTab === 'certificate' ? 'bg-amber-600 text-white' : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
            }`}
            title="Certificate"
          >
            <i className={`fa-solid fa-award text-xs ${activeTab === 'certificate' ? 'text-white' : 'text-amber-600'}`}></i>
            <span className="hidden sm:inline">Certificate</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Column: Video Player & Tools (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-slate-50 border-r border-slate-200/80">
          
          {/* Video Player Container */}
          <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden border-b border-slate-200 shadow-inner">
            {isYouTube ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                title={activeLesson?.title || 'Lecture Video Stream'}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            ) : isBunny ? (
              <iframe
                src={`https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${bunnyVideoId}?autoplay=true&loop=false&muted=false&preload=true`}
                loading="lazy"
                className="w-full h-full border-0"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              ></iframe>
            ) : (
              <video
                ref={videoRef}
                src={directVideoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              ></video>
            )}

            {/* Anti-Piracy Watermark Overlay */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 pointer-events-none opacity-60 text-[9px] sm:text-xs font-mono text-slate-300 bg-slate-950/80 px-2 py-0.5 sm:px-3 sm:py-1 rounded-md border border-slate-800 backdrop-blur-xs flex items-center space-x-1.5 max-w-[200px] truncate">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="truncate">{registrationNumber} &bull; {studentName}</span>
            </div>
          </div>

          {/* Player Control Bar */}
          <div className="p-3 sm:p-5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 bg-white shadow-xs">
            <div className="flex flex-wrap items-center gap-2 sm:space-x-3">
              {activeLesson && (
                <button
                  onClick={() => toggleLessonCompletion(activeLesson.id)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 sm:space-x-2 shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 shadow-xs'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                  }`}
                >
                  <i className={`fa-solid ${isCompleted ? 'fa-circle-check text-emerald-600' : 'fa-check'}`}></i>
                  <span>{isCompleted ? 'Lesson Completed' : 'Mark as Complete'}</span>
                </button>
              )}

              {!isBunny && (
                <div className="flex items-center space-x-0.5 sm:space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200/80 overflow-x-auto">
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs transition shrink-0 ${
                        playbackSpeed === speed ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 text-[11px] sm:text-xs font-semibold text-slate-500 shrink-0">
              <div className="flex items-center space-x-1.5">
                <i className="fa-regular fa-clock text-indigo-600"></i>
                <span>{activeLesson?.duration || '15 mins'}</span>
              </div>
              <div className="hidden sm:flex items-center space-x-1.5">
                <i className="fa-solid fa-signal text-emerald-600"></i>
                <span>HD 1080p</span>
              </div>
            </div>
          </div>

          {/* Interactive Multi-Tab Console */}
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center space-x-2 sm:space-x-4 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('notes')}
                className={`pb-2 px-2 text-xs sm:text-sm font-extrabold transition border-b-2 whitespace-nowrap shrink-0 flex items-center space-x-1.5 ${
                  activeTab === 'notes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <i className="fa-regular fa-file-lines"></i>
                <span>Notes & Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('syllabus')}
                className={`pb-2 px-2 text-xs sm:text-sm font-extrabold transition border-b-2 whitespace-nowrap shrink-0 flex items-center space-x-1.5 lg:hidden ${
                  activeTab === 'syllabus' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <i className="fa-solid fa-list-check text-indigo-500"></i>
                <span>Syllabus</span>
              </button>

              <button
                onClick={() => setActiveTab('code')}
                className={`pb-2 px-2 text-xs sm:text-sm font-extrabold transition border-b-2 whitespace-nowrap shrink-0 flex items-center space-x-1.5 ${
                  activeTab === 'code' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <i className="fa-solid fa-terminal text-indigo-500"></i>
                <span>Code Arena</span>
              </button>

              <button
                onClick={() => setActiveTab('ai-tutor')}
                className={`pb-2 px-2 text-xs sm:text-sm font-extrabold transition border-b-2 whitespace-nowrap shrink-0 flex items-center space-x-1.5 ${
                  activeTab === 'ai-tutor' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <i className="fa-solid fa-robot text-purple-500"></i>
                <span>24/7 AI Tutor</span>
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`pb-2 px-2 text-xs sm:text-sm font-extrabold transition border-b-2 whitespace-nowrap shrink-0 flex items-center space-x-1.5 ${
                  activeTab === 'quiz' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <i className="fa-solid fa-circle-question text-emerald-500"></i>
                <span>Quiz & Check</span>
              </button>

              <button
                onClick={() => setActiveTab('certificate')}
                className={`pb-2 px-2 text-xs sm:text-sm font-extrabold transition border-b-2 whitespace-nowrap shrink-0 flex items-center space-x-1.5 ${
                  activeTab === 'certificate' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <i className="fa-solid fa-award text-amber-500"></i>
                <span>Certificate</span>
              </button>

              <button
                onClick={() => setActiveTab('doubts')}
                className={`pb-2 px-2 text-xs sm:text-sm font-extrabold transition border-b-2 whitespace-nowrap shrink-0 flex items-center space-x-1.5 ${
                  activeTab === 'doubts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <i className="fa-regular fa-comment-dots"></i>
                <span>Doubt Desk</span>
              </button>
            </div>

            {/* TAB 0: SYLLABUS (MOBILE QUICK ACCESS) */}
            {activeTab === 'syllabus' && (
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 lg:hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Course Syllabus &amp; Modules</h3>
                    <p className="text-[11px] text-slate-500">{course.modules.length} Modules &bull; {totalLessonsCount} Lessons</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-extrabold">
                    {progressPercent}% Completed
                  </span>
                </div>

                <div className="space-y-3">
                  {course.modules.map((mod) => (
                    <div key={mod.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-3 py-2.5 border-b border-slate-200 font-bold text-xs text-slate-900 flex items-center justify-between">
                        <span className="truncate pr-2">{mod.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">({mod.videos?.length ?? 0})</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {(mod.videos || []).map((les) => {
                          const isCurrent = activeLesson?.id === les.id;
                          const isDone = completedLessonIds.has(les.id);
                          return (
                            <button
                              key={les.id}
                              onClick={() => {
                                setActiveLesson(les);
                                setActiveTab('notes');
                              }}
                              className={`w-full p-2.5 text-left transition flex items-center justify-between text-xs ${
                                isCurrent ? 'bg-indigo-50/80 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center space-x-2 min-w-0 pr-2">
                                <i className={`fa-solid ${isCurrent ? 'fa-circle-play text-indigo-600' : isDone ? 'fa-circle-check text-emerald-500' : 'fa-play text-slate-300'} text-xs shrink-0`}></i>
                                <span className="truncate">{les.title}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">{les.duration || '15m'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 1: NOTES & OVERVIEW */}
            {activeTab === 'notes' && (
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs leading-relaxed text-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate pr-2">{activeLesson?.title}</h3>
                  <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-bold shrink-0">
                    Module Lesson
                  </span>
                </div>
                <p>
                  Welcome to <strong>{activeLesson?.title}</strong> in <strong>{course.title}</strong>. Follow along with the lecture concepts, run the live code in the <strong>Code Arena</strong> tab, and test your understanding in the <strong>Quiz</strong> tab.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1.5">
                    <div className="font-bold text-indigo-900 text-xs flex items-center space-x-1.5">
                      <i className="fa-solid fa-lightbulb text-indigo-600"></i>
                      <span>Key Takeaways</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-indigo-800 space-y-1">
                      <li>Understand core architecture flow & patterns.</li>
                      <li>Write clean, production-grade modular code.</li>
                      <li>Handle edge cases, validation, and error states.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1.5">
                    <div className="font-bold text-emerald-900 text-xs flex items-center space-x-1.5">
                      <i className="fa-solid fa-laptop-code text-emerald-600"></i>
                      <span>Hands-On Practice</span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Switch to the <strong>Code Arena</strong> tab to test Java, Python, or JS execution directly in your browser.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: IN-BROWSER CODE ARENA */}
            {activeTab === 'code' && (
              <div className="bg-slate-900 text-slate-100 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
                {/* Code Arena Header Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar max-w-full py-0.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Lang:</label>
                    <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl shrink-0">
                      {['javascript', 'python', 'java', 'cpp', 'typescript'].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleLanguageChange(lang)}
                          className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition capitalize shrink-0 ${
                            selectedLanguage === lang
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {lang === 'cpp' ? 'C++' : lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setSourceCode(STARTER_CODE_TEMPLATES[selectedLanguage] || '')}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-1"
                    >
                      <i className="fa-solid fa-arrow-rotate-left text-xs"></i>
                      <span>Reset</span>
                    </button>
                    <button
                      onClick={handleRunCode}
                      disabled={isRunningCode}
                      className="px-3 sm:px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <i className={`fa-solid ${isRunningCode ? 'fa-spinner fa-spin' : 'fa-play'} text-xs`}></i>
                      <span>{isRunningCode ? 'Running...' : 'Run Code ▶'}</span>
                    </button>
                  </div>
                </div>

                {/* Editor Textarea */}
                <div className="relative font-mono text-xs">
                  <textarea
                    rows={12}
                    value={sourceCode}
                    onChange={(e) => setSourceCode(e.target.value)}
                    spellCheck={false}
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                  ></textarea>
                </div>

                {/* Interactive Terminal Output */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Output Console Terminal</span>
                    </span>
                    <button
                      onClick={() => setTerminalOutput('Terminal Cleared.')}
                      className="text-[10px] text-slate-500 hover:text-slate-300"
                    >
                      Clear Terminal
                    </button>
                  </div>
                  <pre className="p-4 bg-black/90 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                    {terminalOutput}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 3: 24/7 AI TUTOR */}
            {activeTab === 'ai-tutor' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                      <i className="fa-solid fa-robot"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">AI Senior Teaching Assistant</h4>
                      <p className="text-[11px] text-slate-500">24/7 Contextual Help for {activeLesson?.title}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold">
                    ● AI Active
                  </span>
                </div>

                {/* Quick Action Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleAskAI(`Explain "${activeLesson?.title}" in simple, beginner-friendly terms with an analogy.`)}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition flex items-center space-x-1"
                  >
                    <span>💡 Explain Concept</span>
                  </button>
                  <button
                    onClick={() => handleAskAI(`What are the top 3 tech interview questions asked on "${activeLesson?.title}" and how to answer them?`)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center space-x-1"
                  >
                    <span>🎯 Interview Questions</span>
                  </button>
                  <button
                    onClick={() => handleAskAI(`What are the common production bugs and mistakes developers make when implementing this topic?`)}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition flex items-center space-x-1"
                  >
                    <span>⚠️ Common Bugs & Traps</span>
                  </button>
                </div>

                {/* Chat Message Feed */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {aiChatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3.5 sm:p-4 rounded-2xl text-xs space-y-1.5 ${
                        msg.sender === 'student'
                          ? 'bg-indigo-600 text-white ml-4 sm:ml-16 rounded-br-xs'
                          : 'bg-slate-50 border border-slate-200/80 text-slate-800 mr-4 sm:mr-16 rounded-bl-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] opacity-70">
                        <span className="font-bold">{msg.sender === 'student' ? 'You (Student)' : 'AI Tutor'}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                    </div>
                  ))}

                  {isAiThinking && (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-50 border border-purple-100 text-purple-900 text-xs space-y-1 mr-4 sm:mr-16">
                      <div className="flex items-center space-x-2">
                        <i className="fa-solid fa-spinner fa-spin text-purple-600"></i>
                        <span className="font-bold">AI Tutor is thinking and analyzing lesson context...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskAI();
                  }}
                  className="flex items-center space-x-2 pt-2 border-t border-slate-100"
                >
                  <input
                    type="text"
                    value={aiInputPrompt}
                    onChange={(e) => setAiInputPrompt(e.target.value)}
                    placeholder="Ask any technical doubt or paste code to debug..."
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                  />
                  <button
                    type="submit"
                    disabled={isAiThinking || !aiInputPrompt.trim()}
                    className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                  >
                    <i className="fa-solid fa-paper-plane"></i>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: CHAPTER QUIZZES */}
            {activeTab === 'quiz' && (() => {
              const questionsList = (activeQuiz && activeQuiz.questions && activeQuiz.questions.length > 0)
                ? activeQuiz.questions
                : sampleQuiz;
              const quizTitle = activeQuiz?.title || 'Module Knowledge Check';
              const isDynamic = Boolean(activeQuiz && activeQuiz.rawId);

              const handleQuizSubmit = async () => {
                setIsSubmittingQuiz(true);
                try {
                  if (isDynamic && activeQuiz) {
                    const answersPayload = questionsList.map((q, idx) => {
                      let qId = typeof q.id === 'string' && q.id.startsWith('q_') ? parseInt(q.id.replace('q_', ''), 10) : Number(q.id);
                      if (isNaN(qId)) qId = idx + 1;
                      return {
                        questionId: qId,
                        selectedOptionIndex: selectedQuizAnswers[String(q.id)] ?? 0,
                      };
                    });

                    const res = await fetch('/api/student/quizzes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        quizId: activeQuiz.rawId,
                        answers: answersPayload,
                      }),
                    });
                    const resData = await res.json();
                    if (resData.success) {
                      setQuizScore(resData.score);
                      setQuizTotal(resData.total);
                    }
                  } else {
                    let score = 0;
                    sampleQuiz.forEach((sq) => {
                      if (selectedQuizAnswers[String(sq.id)] === sq.correct) {
                        score += 1;
                      }
                    });
                    setQuizScore(score);
                    setQuizTotal(sampleQuiz.length);
                  }
                  setQuizSubmitted(true);
                } catch (e) {
                  console.error('Quiz submit error:', e);
                  setQuizSubmitted(true);
                } finally {
                  setIsSubmittingQuiz(false);
                }
              };

              return (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{quizTitle}</h4>
                      <p className="text-[11px] text-slate-500">Test your understanding of core concepts from this module.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                      {questionsList.length} Questions
                    </span>
                  </div>

                  {quizSubmitted && quizScore !== null && quizTotal !== null && (
                    <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                      quizScore / quizTotal >= 0.7 ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <i className={`fa-solid ${quizScore / quizTotal >= 0.7 ? 'fa-circle-check text-emerald-600' : 'fa-triangle-exclamation text-amber-600'} text-base`}></i>
                        <span>
                          {quizScore / quizTotal >= 0.7 ? '🎉 Assessment Passed!' : '⚠️ Assessment Needs Review'} Score: {quizScore} / {quizTotal} ({Math.round((quizScore / quizTotal) * 100)}%)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {questionsList.map((q, qIndex) => {
                      const qKey = String(q.id);
                      const selectedOpt = selectedQuizAnswers[qKey];
                      const isAnswered = selectedOpt !== undefined;
                      const isCorrect = q.correct !== undefined ? selectedOpt === q.correct : true;

                      return (
                        <div key={qKey} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                          <div className="font-bold text-xs text-slate-900">
                            {qIndex + 1}. {q.question}
                          </div>

                          <div className="space-y-2">
                            {q.options.map((opt, optIndex) => {
                              let optClasses = 'p-3 rounded-xl border text-xs font-medium transition cursor-pointer text-left w-full flex items-center justify-between ';
                              if (quizSubmitted) {
                                if (q.correct !== undefined && optIndex === q.correct) {
                                  optClasses += 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                                } else if (selectedOpt === optIndex) {
                                  optClasses += 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold';
                                } else {
                                  optClasses += 'bg-white border-slate-200 text-slate-500 opacity-60';
                                }
                              } else {
                                if (selectedOpt === optIndex) {
                                  optClasses += 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold';
                                } else {
                                  optClasses += 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';
                                }
                              }

                              return (
                                <button
                                  key={optIndex}
                                  type="button"
                                  onClick={() => {
                                    if (!quizSubmitted) {
                                      setSelectedQuizAnswers((prev) => ({ ...prev, [qKey]: optIndex }));
                                    }
                                  }}
                                  className={optClasses}
                                >
                                  <span>{opt}</span>
                                  {selectedOpt === optIndex && (
                                    <i className="fa-solid fa-check text-indigo-600 ml-2"></i>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {quizSubmitted && q.explanation && (
                            <div className="p-3 rounded-xl text-[11px] leading-relaxed bg-slate-100 text-slate-800 border border-slate-200">
                              <strong>💡 Explanation:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    {!quizSubmitted ? (
                      <button
                        type="button"
                        onClick={handleQuizSubmit}
                        disabled={isSubmittingQuiz || Object.keys(selectedQuizAnswers).length < questionsList.length}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-40 flex items-center space-x-2"
                      >
                        {isSubmittingQuiz && <i className="fa-solid fa-spinner fa-spin"></i>}
                        <span>Submit Answers &amp; Review</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setQuizSubmitted(false);
                          setSelectedQuizAnswers({});
                          setQuizScore(null);
                          setQuizTotal(null);
                        }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
                      >
                        Retry Quiz
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* TAB 5: CERTIFICATE OF COMPLETION */}
            {activeTab === 'certificate' && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">Official Certificate of Completion</h4>
                    <p className="text-xs text-slate-500">Verifiable credential authenticated by Educationalgorithm Academy.</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
                  >
                    <i className="fa-solid fa-print text-xs"></i>
                    <span>Print / Save PDF</span>
                  </button>
                </div>

                {/* Certificate Visual Template Card */}
                <div className="p-5 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white border-2 sm:border-4 border-amber-400/60 shadow-2xl relative overflow-hidden text-center space-y-4 sm:space-y-6">
                  {/* Decorative Corner Ornaments */}
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-l-2 border-amber-400 opacity-60"></div>
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-r-2 border-amber-400 opacity-60"></div>
                  <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-l-2 border-amber-400 opacity-60"></div>
                  <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-r-2 border-amber-400 opacity-60"></div>

                  <div className="text-amber-400 text-[10px] sm:text-xs font-black uppercase tracking-widest break-words px-4">
                    EDUCATIONALGORITHM ACADEMY OF TECHNOLOGY
                  </div>

                  <h2 className="text-xl sm:text-3xl font-serif font-bold text-amber-200 break-words px-2">
                    Certificate of Course Completion
                  </h2>

                  <p className="text-[11px] sm:text-xs text-slate-300 max-w-lg mx-auto">
                    This certifies that the candidate listed below has successfully completed all mandatory video modules, practical code challenges, and assessments for:
                  </p>

                  <div className="text-lg sm:text-2xl font-black text-white tracking-wide border-b border-amber-400/40 pb-3 max-w-md mx-auto break-words px-2">
                    {course.title}
                  </div>

                  <div className="text-xl sm:text-3xl font-serif italic text-amber-300 font-semibold truncate px-2">
                    {studentName}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-800 text-left text-[11px] sm:text-xs text-slate-300">
                    <div>
                      <div className="text-[9px] sm:text-[10px] text-amber-400 uppercase font-bold">Registration No</div>
                      <div className="font-mono font-bold text-white text-[11px] sm:text-xs truncate">{registrationNumber}</div>
                    </div>
                    <div>
                      <div className="text-[9px] sm:text-[10px] text-amber-400 uppercase font-bold">Roll Number</div>
                      <div className="font-mono font-bold text-white text-[11px] sm:text-xs truncate">{rollNumber}</div>
                    </div>
                    <div>
                      <div className="text-[9px] sm:text-[10px] text-amber-400 uppercase font-bold">Status</div>
                      <div className="font-bold text-emerald-400 text-[11px] sm:text-xs">Verified &bull; Completed</div>
                    </div>
                    <div>
                      <div className="text-[9px] sm:text-[10px] text-amber-400 uppercase font-bold">Issued On</div>
                      <div className="font-mono text-white text-[11px] sm:text-xs">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: DOUBTS DESK */}
            {activeTab === 'doubts' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
                <form onSubmit={handlePostDoubt} className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Submit Technical Question to Instructor
                  </label>
                  <textarea
                    rows={3}
                    value={doubtText}
                    onChange={(e) => setDoubtText(e.target.value)}
                    placeholder="Describe your question or difficulty regarding this lesson..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
                  ></textarea>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700">
                    Submit to Instructor Desk
                  </button>
                </form>

                {doubtsList.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    {doubtsList.map((d) => (
                      <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{d.user}</span>
                          <span className="text-[10px] text-slate-400">{d.time}</span>
                        </div>
                        <p className="text-slate-700">{d.text}</p>
                        <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                          {d.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Course Curriculum Playlist (4 cols) */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-6 border-l border-slate-200/80 space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Course Syllabus</h2>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{course.modules.length} Modules &bull; {totalLessonsCount} Lessons</span>
              <span className="font-bold text-indigo-600">{progressPercent}% done</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden border border-slate-200">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-4">
            {course.modules.map((mod) => (
              <div key={mod.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs text-slate-900 flex items-center justify-between">
                  <span>{mod.title}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({mod.videos?.length ?? 0} videos)</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {(mod.videos || []).map((les) => {
                    const isCurrent = activeLesson?.id === les.id;
                    const isDone = completedLessonIds.has(les.id);
                    return (
                      <button
                        key={les.id}
                        onClick={() => setActiveLesson(les)}
                        className={`w-full p-3 text-left transition flex items-center justify-between ${
                          isCurrent ? 'bg-indigo-50/80 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0 pr-2">
                          <i className={`fa-solid ${isCurrent ? 'fa-circle-play text-indigo-600' : isDone ? 'fa-circle-check text-emerald-500' : 'fa-play text-slate-300'} text-xs`}></i>
                          <div className="truncate text-xs">{les.title}</div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{les.duration || '15m'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <StudentFooter />
    </div>
  );
}

