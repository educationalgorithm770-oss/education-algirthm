'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import InteractiveTerminal, { TerminalEntry } from '@/components/arena/InteractiveTerminal';
import { NormalizedExecutionResult } from '@/lib/sandbox/dockerRunner';
import { QUESTION_BANK_DATA } from '@/config/question-bank-data';

type SupportedLanguage = 'python' | 'java' | 'cpp' | 'javascript' | 'html_css';
type ExecutionMode = 'interactive' | 'batch';

interface CodeFile {
  id: string;
  name: string;
  content: string;
}

const DEFAULT_STARTER_FILES: Record<SupportedLanguage, CodeFile[]> = {
  java: [
    {
      id: 'main-java',
      name: 'Main.java',
      content: `// Java 21 OpenJDK - Education Algorithm Code Arena
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.println("========================================");
        System.out.println("   STUDENT PROFILE MAKER SYSTEM v2.0    ");
        System.out.println("========================================");
        
        System.out.print("Enter Student ID: ");
        String id = scanner.hasNextLine() ? scanner.nextLine() : "EA-2026-101";
        
        System.out.print("Enter Full Name: ");
        String name = scanner.hasNextLine() ? scanner.nextLine() : "Rahul Kumar";
        
        System.out.print("Enter Email Address: ");
        String email = scanner.hasNextLine() ? scanner.nextLine() : "rahul@gmail.com";
        
        System.out.print("Enter Target Role: ");
        String role = scanner.hasNextLine() ? scanner.nextLine() : "Java Full Stack Developer";
        
        System.out.print("Enter GPA: ");
        String gpa = scanner.hasNextLine() ? scanner.nextLine() : "9.2";
        
        System.out.print("Enter Key Technical Skills: ");
        String skills = scanner.hasNextLine() ? scanner.nextLine() : "Java, Spring Boot, React, MySQL";
        
        System.out.println("========================================");
        System.out.println("STUDENT PROFILE");
        System.out.println("========================================");
        System.out.println("Student ID : " + id);
        System.out.println("Full Name  : " + name);
        System.out.println("Email      : " + email);
        System.out.println("Target Role: " + role);
        System.out.println("GPA        : " + gpa);
        System.out.println("Skills     : " + skills);
    }
}
`,
    },
  ],
  cpp: [
    {
      id: 'main-cpp',
      name: 'main.cpp',
      content: `// C++20 GCC - Education Algorithm Code Arena
#include <iostream>
#include <string>

using namespace std;

int main() {
    string id, name, email, role, gpa, skills;
    
    cout << "========================================" << endl;
    cout << "   STUDENT PROFILE MAKER (C++20)        " << endl;
    cout << "========================================" << endl;
    
    cout << "Enter Student ID: ";
    if (!getline(cin, id)) id = "EA-2026-101";
    
    cout << "Enter Full Name: ";
    if (!getline(cin, name)) name = "Rahul Kumar";
    
    cout << "Enter Email Address: ";
    if (!getline(cin, email)) email = "rahul@gmail.com";
    
    cout << "Enter Target Role: ";
    if (!getline(cin, role)) role = "Systems Engineer";
    
    cout << "Enter GPA: ";
    if (!getline(cin, gpa)) gpa = "9.2";
    
    cout << "Enter Top Technical Skills: ";
    if (!getline(cin, skills)) skills = "C++, STL, Algorithms, Linux";
    
    cout << "========================================" << endl;
    cout << "STUDENT PROFILE" << endl;
    cout << "========================================" << endl;
    cout << "Student ID : " << id << endl;
    cout << "Full Name  : " << name << endl;
    cout << "Email      : " << email << endl;
    cout << "Target Role: " << role << endl;
    cout << "GPA        : " << gpa << endl;
    cout << "Skills     : " << skills << endl;
    
    return 0;
}
`,
    },
  ],
  python: [
    {
      id: 'main-py',
      name: 'main.py',
      content: `# Python 3.12 - Education Algorithm Code Arena
def main():
    print("========================================")
    print("   STUDENT PROFILE MAKER (Python 3.12)  ")
    print("========================================")
    
    try:
        student_id = input("Enter Student ID: ").strip()
    except EOFError:
        student_id = "EA-2026-101"
        
    try:
        name = input("Enter Full Name: ").strip()
    except EOFError:
        name = "Rahul Kumar"
        
    try:
        email = input("Enter Email Address: ").strip()
    except EOFError:
        email = "rahul@gmail.com"
        
    try:
        role = input("Enter Target Job Role: ").strip()
    except EOFError:
        role = "Python AI/ML Engineer"
        
    try:
        gpa = input("Enter GPA: ").strip()
    except EOFError:
        gpa = "9.2"
        
    try:
        skills = input("Enter Skills: ").strip()
    except EOFError:
        skills = "Python, FastAPI, PyTorch, SQL"
        
    print("========================================")
    print("STUDENT PROFILE")
    print("========================================")
    print(f"Student ID : {student_id}")
    print(f"Full Name  : {name}")
    print(f"Email      : {email}")
    print(f"Target Role: {role}")
    print(f"GPA        : {gpa}")
    print(f"Skills     : {skills}")

if __name__ == "__main__":
    main()
`,
    },
  ],
  javascript: [
    {
      id: 'main-js',
      name: 'index.js',
      content: `// Node.js JavaScript Environment
console.log("========================================");
console.log("   STUDENT PROFILE (JavaScript Engine)  ");
console.log("========================================");

const student = {
  id: "EA-2026-101",
  name: "Rahul Kumar",
  email: "rahul@gmail.com",
  role: "Full Stack JavaScript Developer",
  skills: ["JavaScript", "TypeScript", "React", "Node.js"],
  gpa: "9.2"
};

console.log("Student ID : " + student.id);
console.log("Full Name  : " + student.name);
console.log("Email      : " + student.email);
console.log("Target Role: " + student.role);
console.log("GPA        : " + student.gpa);
console.log("Skills     : " + student.skills.join(", "));
console.log("========================================");
`,
    },
  ],
  html_css: [
    {
      id: 'index-html',
      name: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Student Profile Card</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090d16;
      color: #f8fafc;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 1.5rem;
    }
    .profile-card {
      background: linear-gradient(145deg, #131b2e, #0f172a);
      border: 1px solid #1e293b;
      border-radius: 1.5rem;
      padding: 2.25rem;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .badge {
      display: inline-block;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #818cf8;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      margin-bottom: 1.25rem;
    }
    h1 { font-size: 1.65rem; font-weight: 800; color: #fff; margin-bottom: 0.25rem; }
    .role { color: #38bdf8; font-weight: 600; font-size: 0.95rem; margin-bottom: 1.25rem; }
    .meta { background: #0b1120; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; }
    .meta-row { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem; color: #94a3b8; }
    .meta-row:last-child { margin-bottom: 0; }
    .meta-row span:last-child { color: #f1f5f9; font-weight: 600; }
    .skills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .skill-tag { background: #1e293b; color: #cbd5e1; font-size: 0.75rem; font-weight: 600; padding: 0.3rem 0.7rem; border-radius: 0.5rem; border: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="profile-card">
    <div class="badge">🔥 Verified Placement Ready</div>
    <h1>Rahul Kumar</h1>
    <div class="role">Java &amp; Cloud Full Stack Developer</div>
    <div class="meta">
      <div class="meta-row"><span>Student ID</span><span>EA-2026-101</span></div>
      <div class="meta-row"><span>Academic GPA</span><span>9.2 / 10.0</span></div>
      <div class="meta-row"><span>Readiness Score</span><span style="color:#10b981;">94%</span></div>
    </div>
    <div class="skills">
      <span class="skill-tag">Java 21</span>
      <span class="skill-tag">Spring Boot</span>
      <span class="skill-tag">React</span>
      <span class="skill-tag">MySQL</span>
    </div>
  </div>
</body>
</html>
`,
    },
  ],
};

function ProductionCodeArenaInner() {
  const searchParams = useSearchParams();
  const problemIdFromUrl = searchParams.get('problemId') || searchParams.get('problem') || undefined;

  const [language, setLanguage] = useState<SupportedLanguage>('java');
  const [activeProblemId, setActiveProblemId] = useState<string | undefined>(problemIdFromUrl);
  
  // Execution mode is automatically determined by problem configuration (Default: 'batch' for DSA, or 'interactive' for interactive templates)
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('interactive');
  
  const [files, setFiles] = useState<CodeFile[]>(DEFAULT_STARTER_FILES.java);
  const [activeFileId, setActiveFileId] = useState<string>('main-java');
  
  // Custom Input (stdin for Standard Input / Batch Mode)
  const [customStdin, setCustomStdin] = useState<string>(
    'EA-2026-101\nRahul Kumar\nrahul@gmail.com\nJava Full Stack Developer\n9.2\nJava, Spring Boot, React, MySQL'
  );
  const [showCustomInput, setShowCustomInput] = useState<boolean>(true);

  // Layout and Settings
  const [splitLayout, setSplitLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [terminalTheme, setTerminalTheme] = useState<'dark' | 'matrix' | 'monokai' | 'cyberpunk'>('dark');
  const [terminalFontSize, setTerminalFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [terminalTab, setTerminalTab] = useState<'terminal' | 'testcases'>('terminal');

  // Execution State
  const [terminalLogs, setTerminalLogs] = useState<TerminalEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<NormalizedExecutionResult | null>(null);
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);

  // EventSource Stream Ref
  const eventSourceRef = useRef<EventSource | null>(null);
  const activeExecutionIdRef = useRef<string | null>(null);

  // Web Preview State
  const [webViewport, setWebViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [liveHtml, setLiveHtml] = useState<string>(DEFAULT_STARTER_FILES.html_css[0].content);

  // AI Mentor State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiAction, setAiAction] = useState<'explain' | 'complexity' | 'bugs' | 'web_review' | 'custom'>('explain');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [customQuestion, setCustomQuestion] = useState<string>('');

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // Resolve problem configuration if problemId is present
  useEffect(() => {
    if (problemIdFromUrl) {
      setActiveProblemId(problemIdFromUrl);
      const staticFound = QUESTION_BANK_DATA.find((q) => q.id === problemIdFromUrl);
      if (staticFound) {
        // Automatic mode resolution: default to batch for DSA problems
        setExecutionMode(staticFound.executionMode === 'interactive' ? 'interactive' : 'batch');
        if (staticFound.javaSolution) {
          setFiles([
            { id: 'main-java', name: 'Main.java', content: staticFound.javaSolution }
          ]);
        }
      }
    }
  }, [problemIdFromUrl]);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    if (isRunning) {
      handleStopExecution();
    }
    setLanguage(newLang);
    const starter = DEFAULT_STARTER_FILES[newLang];
    setFiles(starter);
    setActiveFileId(starter[0].id);
    if (newLang === 'html_css') {
      setLiveHtml(starter[0].content);
    }
    setTerminalLogs([]);
    setIsRunning(false);
    setIsSubmitting(false);
    setExecutionResult(null);
  };

  const handleCodeChange = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: newContent } : f))
    );
    if (language === 'html_css') {
      setLiveHtml(newContent);
    }
  };

  const handleClearEditor = () => {
    handleCodeChange('');
  };

  const handleResetCode = () => {
    const starter = DEFAULT_STARTER_FILES[language];
    setFiles(starter);
    setActiveFileId(starter[0].id);
    if (language === 'html_css') {
      setLiveHtml(starter[0].content);
    }
  };

  const getExecutionCommandHeader = (lang: SupportedLanguage): string => {
    switch (lang) {
      case 'java':
        return '$ javac Main.java && java Main';
      case 'cpp':
        return '$ g++ -O2 -std=c++20 main.cpp -o main && ./main';
      case 'python':
        return '$ python -u main.py';
      case 'javascript':
        return '$ node index.js';
      case 'html_css':
        return '$ live-server --port=3000 index.html';
    }
  };

  // ── Run Code (Automatically routes to Interactive Stream or Batch) ─────────
  const handleRunCode = async () => {
    if (language === 'html_css') {
      setLiveHtml(activeFile.content);
      return;
    }

    if (isRunning) {
      handleStopExecution();
      return;
    }

    setIsRunning(true);
    setTerminalTab('terminal');
    setExecutionResult(null);

    const cmdHeader = getExecutionCommandHeader(language);
    const initLogs: TerminalEntry[] = [
      { id: 'cmd-' + Date.now(), type: 'system', text: cmdHeader + '\n' },
    ];
    setTerminalLogs(initLogs);

    // ── Mode 1: True Interactive Console Execution ─────────────────────────
    if (executionMode === 'interactive') {
      try {
        const res = await fetch('/api/sandbox/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language,
            code: activeFile.content,
            problemId: activeProblemId,
            mode: 'interactive',
          }),
        });

        const data: NormalizedExecutionResult = await res.json();

        if (data.status === 'Compilation Error' || data.status === 'Execution Error' || data.status === 'Security Error') {
          setExecutionResult(data);
          setTerminalLogs((prev) => [
            ...prev,
            { id: 'err-' + Date.now(), type: 'stderr', text: data.compileError || data.stderr || 'Compilation failed.' },
            { id: 'exit-' + Date.now(), type: 'system', text: '\n...Program terminated with error' },
          ]);
          setIsRunning(false);
          return;
        }

        const execId = data.executionId;
        setActiveExecutionId(execId);
        activeExecutionIdRef.current = execId;

        // Connect to real-time SSE stream
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        const eventSource = new EventSource(`/api/sandbox/stream?executionId=${execId}`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const evt = JSON.parse(event.data);

            if (evt.type === 'stdout') {
              setTerminalLogs((prev) => [
                ...prev,
                { id: 'out-' + Date.now() + Math.random(), type: 'stdout', text: evt.data || '' },
              ]);
            } else if (evt.type === 'stderr') {
              setTerminalLogs((prev) => [
                ...prev,
                { id: 'err-' + Date.now() + Math.random(), type: 'stderr', text: evt.data || '' },
              ]);
            } else if (evt.type === 'stdin_ack') {
              // Echo user input in terminal
              setTerminalLogs((prev) => [
                ...prev,
                { id: 'in-' + Date.now() + Math.random(), type: 'stdin', text: evt.data || '' },
              ]);
            } else if (evt.type === 'execution_finished') {
              const execRes: NormalizedExecutionResult = {
                status: evt.status || 'Accepted',
                stdout: '',
                stderr: '',
                compileError: '',
                runtimeError: '',
                executionTimeMs: evt.executionTimeMs || 0,
                executionId: evt.executionId,
                passed: evt.status === 'Accepted',
                engine: 'Interactive PTY Engine',
                exitCode: evt.exitCode ?? 0,
              };
              setExecutionResult(execRes);
              setTerminalLogs((prev) => [
                ...prev,
                {
                  id: 'exit-' + Date.now(),
                  type: 'system',
                  text: `\n...Program finished with exit code ${evt.exitCode ?? 0} (${evt.executionTimeMs || 0}ms)`,
                },
              ]);
              setIsRunning(false);
              eventSource.close();
            } else if (evt.type === 'execution_stopped') {
              setTerminalLogs((prev) => [
                ...prev,
                { id: 'stop-' + Date.now(), type: 'stderr', text: evt.data || '^C\nProcess stopped.' },
                { id: 'exit-' + Date.now(), type: 'system', text: '\n...Program stopped (exit code 130)' },
              ]);
              setIsRunning(false);
              eventSource.close();
            } else if (evt.type === 'error') {
              setTerminalLogs((prev) => [
                ...prev,
                { id: 'err-' + Date.now(), type: 'stderr', text: 'Execution Error: ' + (evt.data || '') },
              ]);
              setIsRunning(false);
              eventSource.close();
            }
          } catch {}
        };

        eventSource.onerror = () => {
          eventSource.close();
          setIsRunning(false);
        };
      } catch (err: any) {
        setTerminalLogs((prev) => [
          ...prev,
          { id: 'err-' + Date.now(), type: 'stderr', text: 'Failed to launch program: ' + err.message },
        ]);
        setIsRunning(false);
      }
      return;
    }

    // ── Mode 2: Deterministic Standard Input (Batch) Execution ─────────────
    try {
      const res = await fetch('/api/sandbox/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code: activeFile.content,
          problemId: activeProblemId,
          mode: 'batch',
          stdin: showCustomInput ? customStdin : '',
        }),
      });

      const data: NormalizedExecutionResult = await res.json();
      setExecutionResult(data);

      const newLogs: TerminalEntry[] = [...initLogs];

      if (data.status === 'Accepted') {
        if (data.stdout) {
          newLogs.push({ id: 'out-' + Date.now(), type: 'stdout', text: data.stdout });
        } else {
          newLogs.push({ id: 'out-' + Date.now(), type: 'stdout', text: '[Program executed with exit code 0 and no output]' });
        }
        newLogs.push({ id: 'exit-' + Date.now(), type: 'system', text: '\n...Program finished with exit code 0' });
      } else if (data.status === 'Compilation Error') {
        newLogs.push({
          id: 'err-' + Date.now(),
          type: 'stderr',
          text: data.compileError || data.stderr || 'Compilation failed.',
        });
        newLogs.push({ id: 'exit-' + Date.now(), type: 'system', text: '\n...Program compilation failed (exit code 1)' });
      } else if (data.status === 'Time Limit Exceeded') {
        newLogs.push({
          id: 'err-' + Date.now(),
          type: 'stderr',
          text: 'Time Limit Exceeded: Process execution took longer than the configured limit (5.0s).',
        });
        newLogs.push({ id: 'exit-' + Date.now(), type: 'system', text: '\n...Program terminated by watchdog (SIGKILL)' });
      } else if (data.status === 'Security Error') {
        newLogs.push({
          id: 'err-' + Date.now(),
          type: 'stderr',
          text: data.compileError || 'Security Error: Restricted system call detected. Execution halted.',
        });
      } else {
        newLogs.push({
          id: 'err-' + Date.now(),
          type: 'stderr',
          text: data.runtimeError || data.stderr || 'Runtime Exception occurred during execution.',
        });
        newLogs.push({ id: 'exit-' + Date.now(), type: 'system', text: `\n...Program finished with exit code ${data.exitCode ?? 1}` });
      }

      setTerminalLogs(newLogs);
    } catch {
      setTerminalLogs([
        ...initLogs,
        { id: 'err-' + Date.now(), type: 'stderr', text: 'Error: Connection lost to execution cluster.' },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  // ── Send Interactive Stdin Line into Running Process ───────────────────────
  const handleSendInput = async (inputLine: string) => {
    const execId = activeExecutionIdRef.current || activeExecutionId;
    if (!execId || !isRunning) return;

    try {
      await fetch('/api/sandbox/input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionId: execId,
          input: inputLine,
        }),
      });
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        { id: 'err-' + Date.now(), type: 'stderr', text: 'Failed to send input to program: ' + err.message },
      ]);
    }
  };

  // ── Submit Code (Evaluates Against Test Suite) ─────────────────────────────
  const handleSubmitCode = async () => {
    if (language === 'html_css') return;

    setIsSubmitting(true);
    setTerminalTab('testcases');

    const sampleTestCases = [
      {
        id: 'tc-1',
        input: 'EA-2026-101\nRahul Kumar\nrahul@gmail.com\nJava Full Stack Developer\n9.2\nJava, Spring Boot, React, MySQL\n',
        expectedOutput: `========================================\n   STUDENT PROFILE MAKER SYSTEM v2.0    \n========================================\nEnter Student ID: Enter Full Name: Enter Email Address: Enter Target Role: Enter GPA: Enter Key Technical Skills: ========================================\nSTUDENT PROFILE\n========================================\nStudent ID : EA-2026-101\nFull Name  : Rahul Kumar\nEmail      : rahul@gmail.com\nTarget Role: Java Full Stack Developer\nGPA        : 9.2\nSkills     : Java, Spring Boot, React, MySQL`,
      },
      {
        id: 'tc-2',
        input: 'EA-2026-999\nAnanya Sen\nananya@example.com\nCloud Architect\n9.8\nJava, AWS, Kubernetes, Redis\n',
        expectedOutput: `========================================\n   STUDENT PROFILE MAKER SYSTEM v2.0    \n========================================\nEnter Student ID: Enter Full Name: Enter Email Address: Enter Target Role: Enter GPA: Enter Key Technical Skills: ========================================\nSTUDENT PROFILE\n========================================\nStudent ID : EA-2026-999\nFull Name  : Ananya Sen\nEmail      : ananya@example.com\nTarget Role: Cloud Architect\nGPA        : 9.8\nSkills     : Java, AWS, Kubernetes, Redis`,
        isHidden: true,
      },
    ];

    try {
      const res = await fetch('/api/sandbox/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code: activeFile.content,
          problemId: activeProblemId,
          mode: 'batch',
          testCases: sampleTestCases,
        }),
      });
      const data: NormalizedExecutionResult = await res.json();
      setExecutionResult(data);
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Stop Active Running Execution ──────────────────────────────────────────
  const handleStopExecution = async () => {
    const execId = activeExecutionIdRef.current || activeExecutionId;
    if (execId && executionMode === 'interactive') {
      try {
        await fetch('/api/sandbox/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ executionId: execId }),
        });
      } catch {}
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsRunning(false);
    setIsSubmitting(false);
    setTerminalLogs((prev) => [
      ...prev,
      { id: 'stop-' + Date.now(), type: 'stderr', text: '\n^C\nProgram stopped by user (SIGINT).' },
      { id: 'exit-' + Date.now(), type: 'system', text: '\n...Program finished with exit code 130' },
    ]);
  };

  const handleClearTerminal = () => {
    setTerminalLogs([]);
    setExecutionResult(null);
  };

  // Keyboard Shortcuts (F9 Run, Ctrl+Enter Submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        handleRunCode();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [language, activeFile, showCustomInput, customStdin, executionMode, isRunning]);

  // AI Mentor API
  const handleAskAiMentor = async (actionType: 'explain' | 'complexity' | 'bugs' | 'web_review' | 'custom', customQuery?: string) => {
    setAiAction(actionType);
    setAiLoading(true);
    setIsAiModalOpen(true);
    setAiFeedback('');

    const mappedAction =
      actionType === 'explain'
        ? 'hint'
        : actionType === 'complexity'
        ? 'complexity'
        : actionType === 'bugs'
        ? 'bug_detect'
        : actionType === 'web_review'
        ? 'web_review'
        : 'hint';

    try {
      const res = await fetch('/api/ai/code-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mappedAction,
          language: language === 'html_css' ? 'html' : language,
          code: activeFile.content,
          problemTitle: 'Student Code Arena',
          problemContext: 'Coding session',
          errorLogs: executionResult?.compileError || executionResult?.runtimeError || customQuery || '',
          userQuestion: actionType === 'custom' ? (customQuery || customQuestion) : '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiFeedback(data.feedback);
      } else {
        setAiFeedback('AI Mentor is temporarily busy. Please try again in a moment.');
      }
    } catch {
      setAiFeedback('Failed to reach AI Mentor. Please check your network connection.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white font-sans selection:bg-indigo-600 selection:text-white">
      <StudentNavbar />

      {/* ── Top Pro Studio Toolbar ────────────────────────────────────────── */}
      <header className="bg-slate-900 border-b border-slate-800 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 shrink-0 select-none z-20">
        
        {/* Left: Brand & Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition text-xs flex items-center space-x-1"
            title="Return to LMS Dashboard"
          >
            <i className="fa-solid fa-arrow-left"></i>
          </Link>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm">
              <i className="fa-solid fa-code"></i>
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-black text-white flex items-center space-x-1.5">
                <span>Code Arena</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  PRO
                </span>
              </h1>
            </div>
          </div>

          {/* Action Buttons: Run & Submit */}
          <div className="flex items-center space-x-1.5 pl-2">
            <button
              onClick={handleRunCode}
              disabled={isSubmitting}
              className={`px-4 py-1.5 rounded-xl text-white text-xs font-black shadow-lg transition flex items-center space-x-1.5 ${
                isRunning
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-600/30'
              }`}
              title={isRunning ? "Stop Program (Ctrl+C)" : "Run Program (F9)"}
            >
              {isRunning ? (
                <>
                  <i className="fa-solid fa-stop text-xs"></i>
                  <span>Stop (Ctrl+C)</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-play text-[10px]"></i>
                  <span>Run (F9)</span>
                </>
              )}
            </button>

            {language !== 'html_css' && (
              <button
                onClick={handleSubmitCode}
                disabled={isRunning || isSubmitting}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition flex items-center space-x-1.5 disabled:opacity-50"
                title="Submit & Evaluate Test Cases (Ctrl+Enter)"
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-cloud-arrow-up text-[10px]"></i>
                    <span>Submit</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Center: Language Switcher */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => handleLanguageChange('java')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              language === 'java' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>☕ Java 21</span>
          </button>
          <button
            onClick={() => handleLanguageChange('cpp')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              language === 'cpp' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⚡ C++20</span>
          </button>
          <button
            onClick={() => handleLanguageChange('python')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              language === 'python' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🐍 Python</span>
          </button>
          <button
            onClick={() => handleLanguageChange('javascript')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              language === 'javascript' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🟡 JS</span>
          </button>
          <button
            onClick={() => handleLanguageChange('html_css')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              language === 'html_css' ? 'bg-purple-600 text-white shadow' : 'text-purple-300/80 hover:text-purple-200'
            }`}
          >
            <span>🌐 Web</span>
          </button>
        </div>

        {/* Right: Mode Indicator, Layout & AI Mentor */}
        <div className="flex items-center space-x-2">
          {/* Automatic Friendly Mode Indicator (Non-Selectable for Students) */}
          {language !== 'html_css' && (
            <div className="hidden md:flex items-center px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-400">
              {executionMode === 'interactive' ? (
                <span className="text-emerald-400 flex items-center space-x-1.5">
                  <i className="fa-solid fa-terminal text-[10px]"></i>
                  <span>🖥️ Interactive Program</span>
                </span>
              ) : (
                <span className="text-indigo-400 flex items-center space-x-1.5">
                  <i className="fa-solid fa-keyboard text-[10px]"></i>
                  <span>🧩 Standard Input</span>
                </span>
              )}
            </div>
          )}

          {/* Split Layout Switcher */}
          <div className="flex items-center space-x-0.5 bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setSplitLayout('horizontal')}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                splitLayout === 'horizontal' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Side-by-Side Split View"
            >
              <i className="fa-solid fa-columns"></i>
            </button>
            <button
              onClick={() => setSplitLayout('vertical')}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                splitLayout === 'vertical' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Top-Bottom OnlineGDB Split View"
            >
              <i className="fa-solid fa-table-rows"></i>
            </button>
          </div>

          {/* Terminal Theme */}
          <select
            value={terminalTheme}
            onChange={(e) => setTerminalTheme(e.target.value as any)}
            className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
            title="Terminal Theme"
          >
            <option value="dark">Dark Theme</option>
            <option value="matrix">Matrix Green</option>
            <option value="monokai">Monokai Pro</option>
            <option value="cyberpunk">Cyberpunk</option>
          </select>

          {/* AI Mentor */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-xs font-extrabold transition flex items-center space-x-1.5"
          >
            <i className="fa-solid fa-wand-magic-sparkles text-purple-400"></i>
            <span className="hidden sm:inline">AI Mentor</span>
          </button>
        </div>
      </header>

      {/* ── Main Workspace Area ───────────────────────────────────────────── */}
      <main
        className={`flex-1 flex overflow-hidden ${
          splitLayout === 'horizontal' ? 'flex-col lg:flex-row' : 'flex-col'
        }`}
      >
        {/* Left / Top Pane: Code Editor + Custom Input */}
        <div
          className={`${
            splitLayout === 'horizontal'
              ? 'lg:w-1/2 w-full border-r border-slate-800'
              : 'h-[50vh] border-b border-slate-800'
          } flex flex-col bg-slate-950 overflow-hidden shrink-0`}
        >
          {/* File Tabs & Controls */}
          <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center space-x-1 overflow-x-auto">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-1.5 ${
                    activeFileId === file.id
                      ? 'bg-slate-950 text-indigo-400 border border-slate-800'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <i className="fa-solid fa-file-code text-[11px]"></i>
                  <span>{file.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1.5">
              {language !== 'html_css' && executionMode === 'batch' && (
                <button
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 border ${
                    showCustomInput
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-keyboard text-[10px]"></i>
                  <span className="hidden sm:inline">Custom Input</span>
                </button>
              )}

              <button
                onClick={handleClearEditor}
                className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition"
                title="Clear editor code"
              >
                <i className="fa-solid fa-eraser text-[11px] mr-1"></i>
                <span className="hidden sm:inline">Clear</span>
              </button>

              <button
                onClick={handleResetCode}
                className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition"
                title="Reset to starter template"
              >
                <i className="fa-solid fa-rotate-left text-[11px] mr-1"></i>
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Collapsible Custom Input (stdin) Panel - Only active in Standard Input (Batch) Mode */}
          {showCustomInput && language !== 'html_css' && executionMode === 'batch' && (
            <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 shrink-0 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
                  <i className="fa-solid fa-keyboard text-indigo-400"></i>
                  <span>Custom Input (stdin):</span>
                </label>
                <span className="text-[10px] text-slate-500">Fed sequentially into standard input</span>
              </div>
              <textarea
                rows={3}
                value={customStdin}
                onChange={(e) => setCustomStdin(e.target.value)}
                placeholder="Enter input values here..."
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>
          )}

          {/* Editor Area */}
          <div className="flex-1 p-3 sm:p-4 bg-slate-950 overflow-auto">
            <textarea
              value={activeFile.content}
              onChange={(e) => handleCodeChange(e.target.value)}
              spellCheck={false}
              placeholder="Write your code here..."
              className="w-full h-full min-h-[300px] bg-transparent text-emerald-300 focus:outline-none resize-none font-mono text-xs sm:text-[13px] leading-relaxed border-none selection:bg-indigo-600 selection:text-white"
            />
          </div>
        </div>

        {/* Right / Bottom Pane: Terminal / Live Preview / Test Cases */}
        <div
          className={`${
            splitLayout === 'horizontal' ? 'lg:w-1/2 w-full' : 'flex-1'
          } flex flex-col bg-slate-950 overflow-hidden`}
        >
          {language === 'html_css' ? (
            <div className="h-full flex flex-col bg-slate-900/40">
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <i className="fa-solid fa-globe text-purple-400"></i>
                    <span>Live Web Browser Preview</span>
                  </span>
                </div>
                <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setWebViewport('desktop')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      webViewport === 'desktop' ? 'bg-purple-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setWebViewport('tablet')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      webViewport === 'tablet' ? 'bg-purple-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Tablet
                  </button>
                  <button
                    onClick={() => setWebViewport('mobile')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      webViewport === 'mobile' ? 'bg-purple-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 flex items-center justify-center overflow-auto">
                <div
                  className={`transition-all duration-300 h-full min-h-[350px] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700 ${
                    webViewport === 'mobile'
                      ? 'w-[375px]'
                      : webViewport === 'tablet'
                      ? 'w-[768px]'
                      : 'w-full'
                  }`}
                >
                  <iframe
                    title="Live Preview"
                    srcDoc={liveHtml}
                    sandbox="allow-scripts"
                    className="w-full h-full min-h-[350px] border-none bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <InteractiveTerminal
              logs={terminalLogs}
              isRunning={isRunning}
              executionMode={executionMode}
              currentLanguage={language}
              executionResult={executionResult}
              onSendInput={handleSendInput}
              onStopExecution={handleStopExecution}
              onClearTerminal={handleClearTerminal}
              onExplainError={(err) => handleAskAiMentor('explain', err)}
              fontSize={terminalFontSize}
              theme={terminalTheme}
              activeTab={terminalTab}
              onTabChange={setTerminalTab}
            />
          )}
        </div>
      </main>

      {/* AI MENTOR MODAL */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-white">Gemini 3.5 AI Code Mentor</h3>
                  <p className="text-[11px] text-slate-400">Step-by-step logic, error explanations, and complexity audits.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
              <button
                onClick={() => handleAskAiMentor('explain')}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left text-xs space-y-1 transition"
              >
                <div className="text-amber-400 font-bold flex items-center space-x-1">
                  <i className="fa-solid fa-lightbulb text-[10px]"></i>
                  <span>Explain</span>
                </div>
                <p className="text-[10px] text-slate-400">Step-by-step logic</p>
              </button>

              <button
                onClick={() => handleAskAiMentor('complexity')}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left text-xs space-y-1 transition"
              >
                <div className="text-indigo-400 font-bold flex items-center space-x-1">
                  <i className="fa-solid fa-stopwatch text-[10px]"></i>
                  <span>Big-O</span>
                </div>
                <p className="text-[10px] text-slate-400">Time &amp; Space</p>
              </button>

              <button
                onClick={() => handleAskAiMentor('bugs')}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left text-xs space-y-1 transition"
              >
                <div className="text-rose-400 font-bold flex items-center space-x-1">
                  <i className="fa-solid fa-bug text-[10px]"></i>
                  <span>Find Bugs</span>
                </div>
                <p className="text-[10px] text-slate-400">Edge-case audit</p>
              </button>

              <button
                onClick={() => handleAskAiMentor(language === 'html_css' ? 'web_review' : 'explain')}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left text-xs space-y-1 transition"
              >
                <div className="text-emerald-400 font-bold flex items-center space-x-1">
                  <i className={`fa-solid ${language === 'html_css' ? 'fa-palette' : 'fa-circle-question'} text-[10px]`}></i>
                  <span>{language === 'html_css' ? 'CSS Review' : 'Code Review'}</span>
                </div>
                <p className="text-[10px] text-slate-400">{language === 'html_css' ? 'A11y & responsive' : 'Best practices'}</p>
              </button>
            </div>

            <div className="flex gap-2 shrink-0">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Ask any specific question about your code..."
                className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskAiMentor('custom');
                }}
              />
              <button
                onClick={() => handleAskAiMentor('custom')}
                disabled={aiLoading}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition"
              >
                Ask
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
              {aiLoading ? (
                <div className="text-center py-8 space-y-2">
                  <i className="fa-solid fa-spinner fa-spin text-purple-400 text-xl"></i>
                  <p className="text-xs text-purple-200 font-bold">AI Mentor is analyzing your code...</p>
                </div>
              ) : aiFeedback ? (
                <div className="whitespace-pre-line leading-relaxed">{aiFeedback}</div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Click any action above or ask a question to receive mentor insights.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800 shrink-0">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      <StudentFooter />
    </div>
  );
}

export default function ProductionCodeArenaPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
          <div className="flex items-center space-x-3 text-purple-400 font-bold text-sm">
            <i className="fa-solid fa-circle-notch fa-spin text-lg"></i>
            <span>Loading Code Arena Studio...</span>
          </div>
        </div>
      }
    >
      <ProductionCodeArenaInner />
    </React.Suspense>
  );
}
