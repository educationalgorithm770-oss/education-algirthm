'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

type CourseStatus = 'published' | 'draft' | 'archived';

interface VideoLesson {
  id: number;
  title: string;
  bunny_video_id?: string | null;
  youtube_id?: string | null;
  file_path?: string | null;
  video_url?: string | null;
  duration: string;
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
  slug: string;
  description: string;
  level: string;
  duration: string;
  price: number;
  status: CourseStatus;
  modules: CourseModule[];
}

interface ParsedLesson {
  title: string;
  duration?: string;
}

interface ParsedModule {
  title: string;
  description: string;
  lessons: ParsedLesson[];
}

const VALID_STATUSES: CourseStatus[] = ['published', 'draft', 'archived'];

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [successBanner, setSuccessBanner] = useState('');

  // Course Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLevel, setNewLevel] = useState('Intermediate');
  const [newDuration, setNewDuration] = useState('12 Weeks');
  const [newPrice, setNewPrice] = useState('14999');
  const [newStatus, setNewStatus] = useState<CourseStatus>('draft');
  const [courseError, setCourseError] = useState('');

  // Module Builder Form & Smart PDF Parser states
  const [moduleAddMode, setModuleAddMode] = useState<'manual' | 'pdf' | 'text' | 'preview'>('pdf');
  const [modTitle, setModTitle] = useState('');
  const [modDesc, setModDesc] = useState('');
  const [moduleError, setModuleError] = useState('');
  const [syllabusText, setSyllabusText] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedModules, setParsedModules] = useState<ParsedModule[]>([]);

  // Video modal form states
  const [vidTitle, setVidTitle] = useState('');
  const [videoType, setVideoType] = useState<'youtube' | 'bunny' | 'direct'>('youtube');
  const [videoSource, setVideoSource] = useState('');
  const [vidDuration, setVidDuration] = useState('');
  const [videoError, setVideoError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const flash = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(''), 5000);
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/courses?all=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.courses)) {
        setCourses(data.courses);
        if (data.courses.length > 0 && selectedCourseId === null) {
          setSelectedCourseId(data.courses[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0] || null;
  const activeCourseId = selectedCourse?.id || selectedCourseId;

  const loadSampleTemplate = (track: 'fullstack' | 'devops' | 'ai') => {
    setPdfBase64('');
    setPdfFileName('');
    if (track === 'fullstack') {
      setSyllabusText(`# Module 1: Enterprise Java 21 & Spring Boot 3
- Java 21 Virtual Threads & Concurrency
- Spring Boot 3 REST APIs & Data JPA
- Security, JWT & OAuth2 Architecture

# Module 2: Microservices & Event-Driven Systems
- Spring Cloud Config & Eureka Discovery
- Apache Kafka Event Streaming & Resiliency
- Docker Containerization & Multi-Stage Builds

# Module 3: Cloud Deployment & Distributed Caching
- Redis Caching & Distributed Locks
- AWS ECS Fargate & CloudWatch Monitoring
- CI/CD Pipelines with GitHub Actions`);
    } else if (track === 'devops') {
      setSyllabusText(`# Module 1: Infrastructure as Code & Multi-Cloud
- Terraform AWS & Azure State Management
- Ansible Automation & Configuration Drift
- HashiCorp Vault Secrets Management

# Module 2: Production Kubernetes (K8s) Cluster Ops
- K8s Pods, Services, Ingress & Helm 3 Charts
- StatefulSets & Persistent Volume Claims
- Service Mesh with Istio & Traffic Routing

# Module 3: SRE Observability & DevSecOps
- Prometheus Metric Scraping & Grafana Dashboards
- OpenTelemetry Distributed Tracing
- SonarQube & Trivy Security Scans`);
    } else {
      setSyllabusText(`# Module 1: Advanced Deep Learning & PyTorch
- Neural Architecture Design & Backpropagation
- Convolutional & Recurrent Networks
- Transfer Learning with Vision Transformers

# Module 2: Large Language Models (LLMs) & GenAI
- Transformer Self-Attention Deep Dive
- LoRA & QLoRA Fine-Tuning with Unsloth
- RAG Systems with Vector Databases (pgvector)

# Module 3: Scalable MLOps & Production Inference
- Model Quantization (GGUF, AWQ, vLLM)
- Triton Inference Server & TorchServe
- MLflow Tracking & Kubernetes Deployment`);
    }
    setModuleError('');
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newTitle.trim().length < 3) {
      setCourseError('Course title must be at least 3 characters.');
      return;
    }
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      setCourseError('Enter a valid price.');
      return;
    }

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          level: newLevel,
          duration: newDuration,
          price,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowNewCourseModal(false);
        setNewTitle(''); setNewDesc(''); setCourseError('');
        flash(`Course launched successfully!`);
        await fetchCourses();
        if (data.courseId) setSelectedCourseId(data.courseId);
      } else {
        setCourseError(data.message || 'Failed to create course.');
      }
    } catch {
      setCourseError('Connection error. Could not create course.');
    }
  };

  const handleUpdatePricing = async (courseId: number, price: number | string, status: CourseStatus) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(String(price)) || 0;
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: numPrice, status }),
      });
      const data = await res.json();
      if (data.success) {
        flash(`⚡ Status updated to ${status.toUpperCase()} in live database!`);
        await fetchCourses();
      } else {
        flash(`❌ ${data.message || 'Error updating course'}`);
      }
    } catch {
      flash('❌ Error saving course changes.');
    }
  };

  const handleDeleteCourse = async (courseId: number, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete course "${title}" and all its modules?`)) return;
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        flash(`🗑️ Course "${title}" deleted.`);
        setSelectedCourseId(null);
        await fetchCourses();
      } else {
        alert(data.message || 'Failed to delete course.');
      }
    } catch {
      alert('Error deleting course.');
    }
  };

  const handleDeleteModule = async (moduleId: number, title: string) => {
    if (!confirm(`Are you sure you want to delete module "${title}" and its lessons?`)) return;
    try {
      const res = await fetch(`/api/modules/${moduleId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        flash(`🗑️ Module "${title}" deleted.`);
        await fetchCourses();
      } else {
        alert(data.message || 'Failed to delete module.');
      }
    } catch {
      alert('Error deleting module.');
    }
  };

  const handleManualAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modTitle.trim() || modTitle.trim().length < 2) {
      setModuleError('Module title is required.');
      return;
    }
    if (!activeCourseId) {
      setModuleError('Please select a course track first.');
      return;
    }

    try {
      const res = await fetch(`/api/courses/${activeCourseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: modTitle.trim(), description: modDesc.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModuleModal(false);
        setModTitle(''); setModDesc(''); setModuleError('');
        flash('Module added successfully!');
        await fetchCourses();
      } else {
        setModuleError(data.message || 'Failed to add module.');
      }
    } catch {
      setModuleError('Error adding module.');
    }
  };

  // PDF & Syllabus Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    setModuleError('');

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (isPdf) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        setPdfBase64(base64Data);
        setSyllabusText(`📄 [Uploaded PDF: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]\nReady for AI syllabus parsing. Click "Parse Modules with AI" below.`);
      };
      reader.readAsDataURL(file);
    } else {
      setPdfBase64('');
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setSyllabusText(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleParseSyllabus = async () => {
    if (!syllabusText.trim() && !pdfBase64) {
      setModuleError('Please upload a PDF syllabus or paste curriculum text.');
      return;
    }

    try {
      setIsParsing(true);
      setModuleError('');
      const res = await fetch('/api/admin/courses/parse-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: syllabusText,
          pdfBase64: pdfBase64 || undefined,
          courseTitle: selectedCourse?.title || 'Tech Track',
        }),
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.modules) && data.modules.length > 0) {
        setParsedModules(data.modules);
        setModuleAddMode('preview');
      } else {
        setModuleError(data.error || 'Failed to parse syllabus. Try pasting formatted bullet points.');
      }
    } catch (err: any) {
      setModuleError(err.message || 'Error communicating with parser.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleBatchImportModules = async () => {
    if (!activeCourseId) {
      setModuleError('Please select a course track first.');
      return;
    }
    if (parsedModules.length === 0) {
      setModuleError('No modules to import. Parse syllabus first.');
      return;
    }

    try {
      setIsImporting(true);
      setModuleError('');
      const res = await fetch(`/api/admin/courses/${activeCourseId}/batch-modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: parsedModules }),
      });
      const data = await res.json();

      if (data.success) {
        setShowAddModuleModal(false);
        setParsedModules([]);
        setSyllabusText('');
        setPdfFileName('');
        setPdfBase64('');
        flash(`🎉 Successfully created ${data.insertedModules} modules!`);
        await fetchCourses();
      } else {
        setModuleError(data.error || 'Failed to batch import modules.');
      }
    } catch (err: any) {
      setModuleError(err.message || 'Import error.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleRemoveParsedModule = (index: number) => {
    setParsedModules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddLessonToParsed = (mIdx: number) => {
    const lessonTitle = prompt('Enter Lesson Title:');
    if (!lessonTitle) return;
    setParsedModules((prev) => {
      const copy = [...prev];
      copy[mIdx].lessons.push({ title: lessonTitle, duration: '30 mins' });
      return copy;
    });
  };

  const handleRemoveLessonFromParsed = (mIdx: number, lIdx: number) => {
    setParsedModules((prev) => {
      const copy = [...prev];
      copy[mIdx].lessons = copy[mIdx].lessons.filter((_, i) => i !== lIdx);
      return copy;
    });
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vidTitle.trim() || !videoSource.trim() || !activeModuleId) {
      setVideoError('Please enter a lesson title and video link/ID.');
      return;
    }

    try {
      const res = await fetch(`/api/modules/${activeModuleId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: vidTitle.trim(),
          videoType,
          videoSource: videoSource.trim(),
          duration: vidDuration.trim() || '15:00',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddVideoModal(false);
        setVidTitle(''); setVideoSource(''); setVidDuration(''); setVideoError('');
        flash('🎉 Video lesson added successfully!');
        await fetchCourses();
      } else {
        setVideoError(data.message || 'Failed to link video.');
      }
    } catch {
      setVideoError('Error linking video.');
    }
  };

  const handleDeleteVideo = async (videoId: number, title: string) => {
    if (!confirm(`Are you sure you want to delete video lesson "${title}"?`)) return;
    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        flash('🗑️ Video lesson deleted.');
        await fetchCourses();
      } else {
        alert(data.message || 'Failed to delete video.');
      }
    } catch {
      alert('Error deleting video.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-extrabold text-purple-600 uppercase tracking-wider">
              <i className="fa-solid fa-graduation-cap"></i>
              <span>Curriculum Engineering Engine (Live MySQL)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              Enterprise Course &amp; Module Studio
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Launch published learning paths, parse syllabus PDFs with AI, structure modules, and link video streams.
            </p>
          </div>

          <button
            onClick={() => { setShowNewCourseModal(true); setCourseError(''); }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/30 flex items-center justify-center space-x-2"
          >
            <i className="fa-solid fa-plus"></i>
            <span>Create New Course</span>
          </button>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md">
            <i className="fa-solid fa-circle-check text-sm"></i>
            <span>{successBanner}</span>
          </div>
        )}

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Course List */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Course Tracks ({courses.length})</h2>
            
            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs">Loading course catalog...</div>
            ) : courses.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No courses found. Click "Create New Course" above.</div>
            ) : (
              <div className="space-y-2">
                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`w-full text-left p-3 rounded-2xl transition border ${
                      selectedCourseId === course.id
                        ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-600/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs truncate max-w-[170px]">{course.title}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        course.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700'
                          : course.status === 'draft'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {course.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{course.modules?.length || 0} Modules</span>
                      <span className="font-bold text-slate-700">₹{Number(course.price).toLocaleString('en-IN')}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Course Details & Module Manager */}
          <div className="lg:col-span-3 space-y-6">
            {selectedCourse ? (
              <>
                {/* Course Header Bar */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">{selectedCourse.level} • {selectedCourse.duration}</span>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          selectedCourse.status === 'published'
                            ? 'bg-emerald-100 text-emerald-700'
                            : selectedCourse.status === 'draft'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {selectedCourse.status}
                        </span>
                      </div>
                      <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedCourse.title}</h2>
                      <p className="text-xs text-slate-500 mt-1">{selectedCourse.description}</p>
                    </div>

                    <button
                      onClick={() => {
                        setShowAddModuleModal(true);
                        setModuleError('');
                        setModuleAddMode('pdf');
                      }}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-600/30 flex items-center space-x-2 shrink-0"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      <span>Add Module / Import Syllabus</span>
                    </button>
                  </div>

                  {/* Pricing, Status & Course Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
                    <div className="flex items-center space-x-4">
                      <div>
                        <span className="text-slate-400 font-bold block mb-1">Tuition Fee (₹)</span>
                        <input
                          type="number"
                          defaultValue={selectedCourse.price}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0 && val !== selectedCourse.price) {
                              handleUpdatePricing(selectedCourse.id, val, selectedCourse.status);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = parseFloat((e.target as HTMLInputElement).value);
                              if (!isNaN(val) && val >= 0) {
                                handleUpdatePricing(selectedCourse.id, val, selectedCourse.status);
                              }
                            }
                          }}
                          className="w-28 px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg font-black text-slate-900 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                        />
                      </div>
                      <div className="border-l border-slate-200 pl-4">
                        <span className="text-slate-400 font-bold block mb-1">Visibility Status</span>
                        <select
                          value={selectedCourse.status}
                          onChange={(e) => handleUpdatePricing(selectedCourse.id, selectedCourse.price, e.target.value as CourseStatus)}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg font-bold text-xs focus:ring-2 focus:ring-purple-600"
                        >
                          {VALID_STATUSES.map((st) => (
                            <option key={st} value={st}>{st.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCourse(selectedCourse.id, selectedCourse.title)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5"
                    >
                      <i className="fa-regular fa-trash-can"></i>
                      <span>Delete Course</span>
                    </button>
                  </div>
                </div>

                {/* Modules Hierarchy */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <i className="fa-solid fa-layer-group text-purple-600"></i>
                      <span>Course Modules ({selectedCourse.modules?.length || 0})</span>
                    </h3>
                  </div>

                  {(!selectedCourse.modules || selectedCourse.modules.length === 0) ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm space-y-3">
                      <i className="fa-solid fa-file-pdf text-3xl text-purple-300 block"></i>
                      <p className="font-medium text-slate-600">No modules added to this course yet.</p>
                      <button
                        onClick={() => {
                          setShowAddModuleModal(true);
                          setModuleAddMode('pdf');
                        }}
                        className="px-4 py-2 bg-purple-50 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 hover:bg-purple-100 transition"
                      >
                        Import Syllabus PDF with AI
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedCourse.modules.map((mod, index) => (
                        <div key={mod.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-start space-x-3 min-w-0 flex-1">
                              <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm">{mod.title}</h4>
                                <p className="text-[11px] text-slate-400">{mod.description || 'Core learning track.'}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                              <button
                                onClick={() => {
                                  setActiveModuleId(mod.id);
                                  setShowAddVideoModal(true);
                                  setVideoError('');
                                }}
                                className="inline-flex items-center space-x-1.5 whitespace-nowrap px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                              >
                                <i className="fa-solid fa-plus text-[11px]"></i>
                                <span>Add Video</span>
                              </button>
                              <button
                                onClick={() => handleDeleteModule(mod.id, mod.title)}
                                title="Delete module"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              >
                                <i className="fa-regular fa-trash-can text-xs"></i>
                              </button>
                            </div>
                          </div>

                          {/* Lessons inside Module */}
                          <div className="space-y-2">
                            {(!mod.videos || mod.videos.length === 0) ? (
                              <div className="py-4 px-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                <div className="flex items-center space-x-2 text-slate-500">
                                  <i className="fa-solid fa-film text-purple-400"></i>
                                  <span className="font-medium">No video lessons linked in this module yet.</span>
                                </div>
                                <button
                                  onClick={() => {
                                    setActiveModuleId(mod.id);
                                    setShowAddVideoModal(true);
                                    setVideoError('');
                                  }}
                                  className="px-3 py-1 bg-white hover:bg-slate-100 text-purple-700 font-bold border border-purple-200 rounded-xl text-xs transition"
                                >
                                  + Add First Video Lesson
                                </button>
                              </div>
                            ) : (
                              <>
                                {mod.videos.map((vid, vIdx) => {
                                  const isYT = Boolean(vid.youtube_id);
                                  const isBunny = Boolean(vid.bunny_video_id && !isYT);
                                  return (
                                    <div key={vid.id} className="p-3 bg-slate-50 hover:bg-purple-50/40 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs transition">
                                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                                        <i className="fa-regular fa-circle-play text-purple-600 text-sm shrink-0"></i>
                                        <span className="font-bold text-slate-800 truncate">{vIdx + 1}. {vid.title}</span>
                                        {isYT ? (
                                          <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 font-black text-[9px] uppercase tracking-wider shrink-0">YouTube</span>
                                        ) : isBunny ? (
                                          <span className="px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 font-black text-[9px] uppercase tracking-wider shrink-0">BunnyCDN</span>
                                        ) : (
                                          <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-black text-[9px] uppercase tracking-wider shrink-0">MP4</span>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-3 shrink-0">
                                        <span className="text-[11px] text-slate-400 font-mono font-bold">{vid.duration || '15:00'}</span>
                                        <button
                                          onClick={() => handleDeleteVideo(vid.id, vid.title)}
                                          title="Delete video lesson"
                                          className="text-slate-400 hover:text-rose-600 p-1 transition"
                                        >
                                          <i className="fa-regular fa-trash-can text-xs"></i>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}

                                <button
                                  onClick={() => {
                                    setActiveModuleId(mod.id);
                                    setShowAddVideoModal(true);
                                    setVideoError('');
                                  }}
                                  className="w-full py-2 border border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50 text-purple-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                                >
                                  <i className="fa-solid fa-plus text-[10px]"></i>
                                  <span>Add Another Video Lesson</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">Select a course to manage modules.</div>
            )}
          </div>
        </div>

      </main>

      {/* Modal 1: Create New Course */}
      {showNewCourseModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Launch New Course Track</h3>
              <button onClick={() => setShowNewCourseModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {courseError && <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold">{courseError}</div>}

            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Course Title</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Systems & Cloud Microservices"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  placeholder="Comprehensive curriculum outline..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Level</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Mastery">Mastery Track</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewCourseModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/30"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Smart PDF & AI-Powered Module Builder */}
      {showAddModuleModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center space-x-2">
                  <i className="fa-solid fa-wand-magic-sparkles text-purple-600"></i>
                  <span>Smart Module Builder &amp; Syllabus Parser</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import modules and lessons via PDF upload, paste structured markdown, or add manually.
                </p>
              </div>
              <button onClick={() => setShowAddModuleModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setModuleAddMode('pdf')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  moduleAddMode === 'pdf' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <i className="fa-solid fa-file-pdf"></i>
                <span>Upload Syllabus (PDF / TXT)</span>
              </button>

              <button
                onClick={() => setModuleAddMode('text')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  moduleAddMode === 'text' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <i className="fa-solid fa-paste"></i>
                <span>Paste Curriculum Text</span>
              </button>

              <button
                onClick={() => setModuleAddMode('manual')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  moduleAddMode === 'manual' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <i className="fa-solid fa-pen"></i>
                <span>Single Manual Entry</span>
              </button>

              {parsedModules.length > 0 && (
                <button
                  onClick={() => setModuleAddMode('preview')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    moduleAddMode === 'preview' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-700 bg-purple-50'
                  }`}
                >
                  <i className="fa-solid fa-list-check"></i>
                  <span>Review Modules ({parsedModules.length})</span>
                </button>
              )}
            </div>

            {moduleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold">
                {moduleError}
              </div>
            )}

            {/* TAB 1: PDF / File Upload */}
            {moduleAddMode === 'pdf' && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/50 hover:bg-purple-50 rounded-2xl p-8 text-center cursor-pointer transition space-y-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto text-xl shadow-sm">
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {pdfFileName ? pdfFileName : 'Click to Upload Syllabus Document'}
                    </h4>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Supports PDF, TXT, and Markdown files. AI will automatically extract modules and lessons.
                    </p>
                  </div>
                </div>

                {/* Quick sample curriculum chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 block">Or load a pre-built industry syllabus:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => loadSampleTemplate('fullstack')}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold border border-purple-200 transition"
                    >
                      ☕ Java Full Stack & Microservices
                    </button>
                    <button
                      type="button"
                      onClick={() => loadSampleTemplate('devops')}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition"
                    >
                      ☁️ DevOps & Multi-Cloud Ops
                    </button>
                    <button
                      type="button"
                      onClick={() => loadSampleTemplate('ai')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 transition"
                    >
                      🤖 Data Science, LLMs & GenAI
                    </button>
                  </div>
                </div>

                {syllabusText && (
                  <div>
                    <label className="font-bold text-slate-700 text-xs block mb-1">Extracted Text Preview</label>
                    <textarea
                      value={syllabusText}
                      onChange={(e) => setSyllabusText(e.target.value)}
                      rows={5}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleParseSyllabus}
                    disabled={isParsing || !syllabusText}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/30 transition flex items-center space-x-2 disabled:opacity-50"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>{isParsing ? 'AI Parsing Syllabus...' : 'Parse Modules with AI'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Paste Structured Text */}
            {moduleAddMode === 'text' && (
              <div className="space-y-4">
                {/* Quick sample curriculum chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 block">Click to paste ready template:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => loadSampleTemplate('fullstack')}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold border border-purple-200 transition"
                    >
                      ☕ Java Full Stack
                    </button>
                    <button
                      type="button"
                      onClick={() => loadSampleTemplate('devops')}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition"
                    >
                      ☁️ DevOps & K8s
                    </button>
                    <button
                      type="button"
                      onClick={() => loadSampleTemplate('ai')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 transition"
                    >
                      🤖 PyTorch & GenAI
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-xs block mb-1">
                    Paste Curriculum Bullet Points or Outline
                  </label>
                  <textarea
                    placeholder={`# Module 1: Core Fundamentals
- Lesson 1: Introduction to Environment
- Lesson 2: Architecture Deep Dive

# Module 2: Concurrency & Threads
- Lesson 1: Virtual Threads vs OS Threads
- Lesson 2: Thread Pools and Executors`}
                    value={syllabusText}
                    onChange={(e) => setSyllabusText(e.target.value)}
                    rows={8}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleParseSyllabus}
                    disabled={isParsing || !syllabusText}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/30 transition flex items-center space-x-2 disabled:opacity-50"
                  >
                    <i className="fa-solid fa-gear"></i>
                    <span>{isParsing ? 'Structuring...' : 'Convert to Modules'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Single Manual Entry */}
            {moduleAddMode === 'manual' && (
              <form onSubmit={handleManualAddModule} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Module Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Module 1: Core Java 21 & Concurrency"
                    value={modTitle}
                    onChange={(e) => setModTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    placeholder="What will learners achieve in this module?"
                    value={modDesc}
                    onChange={(e) => setModDesc(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/30"
                  >
                    Add Single Module
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: Interactive Review & Tree View */}
            {moduleAddMode === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600">
                    <i className="fa-solid fa-circle-check mr-1"></i>
                    Successfully parsed {parsedModules.length} Modules &amp; {parsedModules.reduce((a, m) => a + m.lessons.length, 0)} Lessons
                  </span>
                  <button
                    onClick={() => setModuleAddMode('pdf')}
                    className="text-xs text-purple-600 font-bold hover:underline"
                  >
                    Re-upload Document
                  </button>
                </div>

                {/* Tree View */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {parsedModules.map((mod, mIdx) => (
                    <div key={mIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={mod.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedModules((prev) => {
                              const copy = [...prev];
                              copy[mIdx].title = val;
                              return copy;
                            });
                          }}
                          className="font-bold text-slate-900 text-xs bg-white px-2 py-1 border border-slate-200 rounded-lg flex-1 mr-2"
                        />
                        <button
                          onClick={() => handleRemoveParsedModule(mIdx)}
                          className="text-rose-500 hover:text-rose-700 p-1 text-xs"
                          title="Remove Module"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>

                      {/* Lesson sub-items */}
                      <div className="space-y-1.5 pl-3 border-l-2 border-purple-300">
                        {mod.lessons.map((les, lIdx) => (
                          <div key={lIdx} className="flex items-center justify-between text-[11px] bg-white p-1.5 px-2 rounded-lg border border-slate-100">
                            <span className="text-slate-800 font-medium">{lIdx + 1}. {les.title}</span>
                            <button
                              onClick={() => handleRemoveLessonFromParsed(mIdx, lIdx)}
                              className="text-slate-400 hover:text-rose-600 ml-2"
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => handleAddLessonToParsed(mIdx)}
                          className="text-[11px] font-bold text-purple-600 hover:underline pt-1 flex items-center space-x-1"
                        >
                          <i className="fa-solid fa-plus text-[10px]"></i>
                          <span>Add Lesson</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Confirm Batch Import */}
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModuleModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBatchImportModules}
                    disabled={isImporting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center space-x-2"
                  >
                    <i className="fa-solid fa-cloud-arrow-down"></i>
                    <span>{isImporting ? 'Importing to Course...' : `Confirm & Import All (${parsedModules.length} Modules)`}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Modal 3: Add/Link Video Lesson */}
      {showAddVideoModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Add Video Lesson</h3>
                <p className="text-[11px] text-slate-500">Supports YouTube, Bunny.net CDN, or direct MP4 streams</p>
              </div>
              <button onClick={() => setShowAddVideoModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {videoError && <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold">{videoError}</div>}

            {/* Video Provider Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setVideoType('youtube')}
                className={`py-2 text-xs font-extrabold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                  videoType === 'youtube'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <i className="fa-brands fa-youtube"></i>
                <span>YouTube</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoType('bunny')}
                className={`py-2 text-xs font-extrabold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                  videoType === 'bunny'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <i className="fa-solid fa-bolt"></i>
                <span>BunnyCDN</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoType('direct')}
                className={`py-2 text-xs font-extrabold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                  videoType === 'direct'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <i className="fa-solid fa-file-video"></i>
                <span>MP4 Stream</span>
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lesson Title</label>
                <input
                  type="text"
                  placeholder="e.g. 1.2 In-Depth Spring Security Architecture"
                  value={vidTitle}
                  onChange={(e) => setVidTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {videoType === 'youtube' && 'YouTube URL or Video ID'}
                  {videoType === 'bunny' && 'Bunny.net Video GUID'}
                  {videoType === 'direct' && 'Direct MP4 Stream URL'}
                </label>
                <input
                  type="text"
                  placeholder={
                    videoType === 'youtube'
                      ? 'e.g. https://youtu.be/9SGDpanrc8U or 9SGDpanrc8U'
                      : videoType === 'bunny'
                      ? 'e.g. 8f9b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d'
                      : 'e.g. https://domain.com/videos/lesson1.mp4'
                  }
                  value={videoSource}
                  onChange={(e) => setVideoSource(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {videoType === 'youtube' && 'Paste standard or shortened YouTube links or the 11-char ID.'}
                  {videoType === 'bunny' && 'Enter your video ID from Bunny Stream Media Library.'}
                  {videoType === 'direct' && 'Provide an accessible direct HTTP/HTTPS .mp4 link or S3/Cloud storage path.'}
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Duration (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 24:15"
                  value={vidDuration}
                  onChange={(e) => setVidDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVideoModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/30 transition flex items-center space-x-1.5"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Add Lesson</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StudentFooter />
    </div>
  );
}
