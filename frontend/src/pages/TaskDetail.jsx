import { useEffect, useState, useRef, lazy, Suspense } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
const Editor = lazy(() => import('@monaco-editor/react'))
import { useStore } from '../store/useStore'
import api from '../api/client'
import { initMonaco } from '../utils/monaco'

initMonaco()

const TYPE_BADGES = {
  GENERAL: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
  CODE:    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  QUIZ:    'bg-purple-500/10 text-purple-400 border border-purple-500/20',
}

const PYTHON_DEFAULT = `# Write your Python solution here\n\nprint("Hello, World!")\n`
const C_DEFAULT = `// Write your C solution here\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n`

export default function TaskDetail() {
  const { id } = useParams()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(null)
  const [timerActive, setTimerActive] = useState(false)
  
  // Input states for different types
  const [lang, setLang] = useState('python')
  const [code, setCode] = useState(PYTHON_DEFAULT)
  const [generalAnswer, setGeneralAnswer] = useState('')
  const [quizAnswers, setQuizAnswers] = useState({}) // { [questionId]: 'selectedOptionText' }

  // Runner / Compiler state
  const [running, setRunning] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [runResult, setRunResult] = useState(null) // { stdout, stderr, exitCode, compileError, error }
  const [showConsole, setShowConsole] = useState(false)
  const [showInput, setShowInput] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [tab, setTab] = useState('problem')
  const [history, setHistory] = useState([])
  const editorRef = useRef(null)
  const navigate = useNavigate()
  const ideTheme = useStore(s => s.ideTheme)
  const isCompleted = history.some(s => s.status === 'Accepted')
  const showToast = useStore(s => s.showToast)
  const setIsExamMode = useStore(s => s.setIsExamMode)

  // Restricted Exam Mode States
  const [restrictedModeActive, setRestrictedModeActive] = useState(false)
  const [warningMsg, setWarningMsg] = useState(null)
  const lastViolationTime = useRef(0)

  useEffect(() => {
    if (restrictedModeActive) {
      setIsExamMode(true)
    }
    return () => {
      setIsExamMode(false)
    }
  }, [restrictedModeActive, setIsExamMode])

  const showWarning = (msg) => {
    setWarningMsg(msg)
    setTimeout(() => setWarningMsg(null), 3000)
  }

  const reportViolation = async (reason) => {
    // Throttling to prevent alert loops or double logging
    const now = Date.now();
    if (now - lastViolationTime.current < 2500) return;
    lastViolationTime.current = now;

    try {
      console.warn(`Violation: ${reason}`);
      await api.post(`/tasks/${id}/violation`, { reason });
    } catch (e) {
      console.error('Failed to log violation', e);
    }
  };

  useEffect(() => {
    if (!restrictedModeActive || !task) return;

    // Prevent context menu (right click)
    const handleContextMenu = (e) => {
      e.preventDefault();
      reportViolation('Attempted to right-click (open context menu)');
      showWarning('⚠️ Right-click is disabled in Restricted Exam Mode!');
    };

    // Prevent key combinations
    const handleKeyDown = (e) => {
      // F12 key
      if (e.key === 'F12') {
        e.preventDefault();
        reportViolation('Pressed F12 (Developer Tools)');
        showWarning('⚠️ Developer tools are disabled!');
      }

      // Ctrl + Shift + I/J/C
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) {
        e.preventDefault();
        reportViolation('Pressed Ctrl+Shift+I/J/C (Developer Tools)');
        showWarning('⚠️ Developer tools are disabled!');
      }

      // Ctrl + U (View Source)
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        reportViolation('Pressed Ctrl+U (View Source)');
        showWarning('⚠️ View Page Source is disabled!');
      }

      // Ctrl + R, F5 (Reload)
      if (e.key === 'F5' || (e.ctrlKey && (e.key === 'r' || e.key === 'R'))) {
        e.preventDefault();
        reportViolation('Attempted to reload the page');
        showWarning('⚠️ Reloading is disabled during the task!');
      }

      // Ctrl + T, Ctrl + N, Ctrl + W
      if (e.ctrlKey && ['t', 'T', 'n', 'N', 'w', 'W'].includes(e.key)) {
        e.preventDefault();
        reportViolation('Attempted shortcut for new tab or window');
      }

      // Alt key
      if (e.altKey) {
        reportViolation('Pressed Alt key (possible tab switcher)');
      }
    };

    // Detect Tab switching / Minimizing
    const handleVisibilityChange = () => {
      if (document.hidden) {
        api.post(`/tasks/${id}/violation`, { reason: 'Tab switched / window minimized' }).catch(()=>{});
        navigate('/dashboard');
      }
    };

    // Detect Window Blur (clicking outside, Alt+Tab, opening another app)
    const handleBlur = () => {
      api.post(`/tasks/${id}/violation`, { reason: 'Window lost focus' }).catch(()=>{});
      navigate('/dashboard');
    };

    // Detect Fullscreen Exit
    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.mozFullScreenElement || 
                           document.msFullscreenElement;
      if (!isFullscreen && restrictedModeActive) {
        api.post(`/tasks/${id}/violation`, { reason: 'Exited Fullscreen Mode' }).catch(()=>{});
        navigate('/dashboard');
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [restrictedModeActive, task]);


  useEffect(() => {
    api.get(`/tasks/${id}`)
      .then(r => {
        const t = r.data?.task
        setTask(t)
        if (t?.targetTime) {
          setTimeLeft(t.targetTime)
          setTimerActive(true)
        }
        if (t?.starterCode) {
          setCode(t.starterCode)
        } else {
          setCode(lang === 'c' ? C_DEFAULT : PYTHON_DEFAULT)
        }
      })
      .catch(() => setError('Task not found.'))
      .finally(() => setLoading(false))

    // Fetch submission history for this task
    api.get('/submissions')
      .then(r => {
        const mySubs = (r.data?.submissions || []).filter(s => s.taskId === id)
        setHistory(mySubs)
      })
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const intervalId = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
      return () => clearInterval(intervalId)
    } else if (timerActive && timeLeft === 0) {
      setTimerActive(false)
      submit() // Auto-submit when time is up
    }
  }, [timerActive, timeLeft])

  // Ctrl+Enter to run code in editor
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        runCode()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [code, lang, customInput])

  const handleLanguageChange = (newLang) => {
    setLang(newLang)
    if (newLang === 'c') {
      setCode(C_DEFAULT)
    } else {
      setCode(task?.starterCode || PYTHON_DEFAULT)
    }
    setRunResult(null)
  }

  const runCode = async () => {
    const expectsInput = lang === 'python' ? /input\s*\(/.test(code) : /(scanf|gets|fgets|getchar)\s*\(/.test(code)
    
    if (expectsInput && !showInput) {
      setShowConsole(true)
      setShowInput(true)
      showToast("This code requires input. Please enter it below and run again.", "info")
      return
    }

    if (!expectsInput) {
      setShowInput(false)
    }

    setRunning(true)
    setRunResult(null)
    setShowConsole(true)
    try {
      const res = await api.post('/tasks/run-code', {
        code,
        language: lang,
        input: customInput
      })
      setRunResult(res.data)
    } catch (e) {
      setRunResult({
        stdout: '',
        stderr: e.response?.data?.error || 'Failed to connect to execution sandbox.',
        exitCode: 1
      })
    } finally {
      setRunning(false)
    }
  }

  const submit = async () => {
    setSubmitting(true)
    setResult(null)

    let submissionPayload = ''
    if (task.type === 'GENERAL') {
      if (!generalAnswer.trim()) {
        showToast('Please write your answer before submitting.', 'warning')
        setSubmitting(false)
        return
      }
      submissionPayload = generalAnswer
    } else if (task.type === 'QUIZ') {
      const allAnswered = task.quizQuestions.every(q => quizAnswers[q.id])
      if (!allAnswered && !confirm('You have unanswered questions. Are you sure you want to submit?')) {
        setSubmitting(false)
        return
      }
      const answersArray = (task.quizQuestions || []).map(q => ({
        questionId: q.id,
        answer: quizAnswers[q.id] || ''
      }))
      submissionPayload = JSON.stringify(answersArray)
    } else {
      submissionPayload = code
    }

    const timeTaken = task.targetTime ? task.targetTime - timeLeft : null

    try {
      const r = await api.post(`/tasks/${id}/submit`, { code: submissionPayload, timeTaken, language: task.type === 'CODE' ? lang : undefined })
      const sub = r.data?.submission
      setResult({
        ok: true,
        msg: r.data?.message || 'Submitted! Awaiting review.',
        marks: sub?.marks,
        earnedXp: sub?.earnedXp,
        status: sub?.status,
        autoGraded: sub?.feedback?.startsWith('Auto-graded')
      })
      if (sub?.status === 'Accepted') {
        setTimeout(() => navigate('/dashboard'), 2500)
      } else {
        navigate('/dashboard')
      }
    } catch (e) {
      setResult({ ok: false, msg: e.response?.data?.error || 'Submission failed.' })
      setTab('result')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-4">
      <div className="h-8 w-64 rounded-xl bg-white/5 animate-pulse" />
      <div className="h-96 rounded-2xl bg-white/5 animate-pulse" />
    </div>
  )

  // Render Restricted Warning Dialog Overlay
  if (!restrictedModeActive && task && !loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card rounded-3xl p-8 border border-red-500/20 text-center space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 text-3xl animate-pulse">
            🔒
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Restricted Exam Mode</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              To proceed with this task, you must enter Restricted Mode. This will lock your browser window. You are prohibited from:
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 text-left text-xs text-slate-400 space-y-2">
            <p className="flex items-center gap-2">❌ <span className="font-semibold text-slate-300">Leaving this tab</span> (switching windows/tabs)</p>
            <p className="flex items-center gap-2">❌ <span className="font-semibold text-slate-300">Exiting fullscreen mode</span></p>
            <p className="flex items-center gap-2">❌ <span className="font-semibold text-slate-300">Using dev-tools shortcuts</span> (F12, Ctrl+Shift+I)</p>
            <p className="flex items-center gap-2">❌ <span className="font-semibold text-slate-300">Right-clicking</span> or page reloading</p>
          </div>

          <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
            🚨 Violations are automatically logged and reported to the Administrator.
          </p>

          <button
            onClick={() => {
              const elem = document.documentElement;
              if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(() => {});
              }
              setRestrictedModeActive(true);
            }}
            className="w-full btn-glow rounded-xl bg-gradient-to-r from-red-500 to-violet-600 py-3 text-sm font-bold text-white hover:opacity-95 transition-opacity"
          >
            I Understand & Start Task
          </button>
        </div>
      </div>
    );
  }

  if (error || !task) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-3">😕</p>
      <p className="text-slate-400">{error || 'Task not found.'}</p>
      <Link to="/tasks" className="mt-4 inline-block text-cyan-400 hover:underline text-sm">← Back to Tasks</Link>
    </div>
  )

  const DIFF_COLOR = {
    Beginner: 'bg-green-500/10 text-green-400',
    Intermediate: 'bg-yellow-500/10 text-yellow-400',
    Advanced: 'bg-red-500/10 text-red-400',
  }

  const handleSelectQuizOption = (qId, optionText) => {
    setQuizAnswers(prev => ({
      ...prev,
      [qId]: optionText
    }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 relative">
      {warningMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-red-500/90 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold animate-pulse text-sm">
          {warningMsg}
        </div>
      )}
      {/* Breadcrumb */}
      <Link to="/tasks" className="text-sm text-slate-500 hover:text-slate-300 transition-colors mb-4 inline-flex items-center gap-1">
        ← All Tasks
      </Link>

      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        {/* Left Panel — Problem */}
        <div className="lg:w-[42%] flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {task.type && (
                <span className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${TYPE_BADGES[task.type] || 'bg-white/5 text-slate-400'}`}>
                  {task.type}
                </span>
              )}
              {task.difficulty && (
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${DIFF_COLOR[task.difficulty] || ''}`}>{task.difficulty}</span>
              )}
              {task.deadline && (
                <span className="text-xs text-slate-500">⏰ Due {new Date(task.deadline).toLocaleDateString()}</span>
              )}
              {timeLeft !== null && (
                <span className={`text-xs px-2 py-0.5 rounded-md font-bold tracking-wider ${timeLeft < 60 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white'}`}>
                  ⏱ {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>
            <h1 className="text-xl font-black text-white">{task.title}</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 glass-card rounded-xl p-1 overflow-x-auto scrollbar-hide">
            {['problem', 'hints', 'history', 'result'].map(t => (
              (t === 'hints' && task.type === 'QUIZ') ? null : (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                    tab === t ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:text-white'
                  }`}>{t}
                </button>
              )
            ))}
          </div>

          <div className="glass-card rounded-2xl p-6 flex-1 overflow-auto min-h-[280px]">
            {tab === 'problem' && (
              <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                <p className="whitespace-pre-wrap">{task.description}</p>
                {task.type === 'CODE' && task.sampleInput && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Sample Input</p>
                    <pre className="bg-black/40 rounded-xl p-3 text-xs overflow-auto">{task.sampleInput}</pre>
                  </div>
                )}
                {task.type === 'CODE' && task.sampleOutput && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Sample Output</p>
                    <pre className="bg-black/40 rounded-xl p-3 text-xs overflow-auto">{task.sampleOutput}</pre>
                  </div>
                )}
              </div>
            )}
            {tab === 'hints' && (
              task.hints
                ? <p className="text-sm text-slate-300 whitespace-pre-wrap">{task.hints}</p>
                : <p className="text-slate-600 text-sm">No hints for this task. You've got this!</p>
            )}
            {tab === 'result' && result && (
              <div className={`rounded-xl p-5 space-y-3 ${result.ok ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                <p className={`font-semibold ${result.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {result.ok ? '✓ Submitted!' : '✗ Error'}
                </p>
                <p className="text-sm opacity-80 text-slate-300">{result.msg}</p>
                {result.autoGraded && (
                  <div className="flex items-center gap-3 bg-emerald-500/10 rounded-lg px-3 py-2">
                    <span className="text-lg">🤖</span>
                    <div>
                      <p className="text-xs font-bold text-emerald-400">Auto-graded ✓</p>
                      {result.marks != null && <p className="text-xs text-slate-300">Marks: <span className="font-bold text-white">{result.marks}</span></p>}
                      {result.earnedXp > 0 && <p className="text-xs text-yellow-400 font-bold">⚡ +{result.earnedXp} XP earned!</p>}
                    </div>
                  </div>
                )}
                {result.ok && <Link to="/submissions" className="text-xs mt-1 inline-block underline text-cyan-400">View Submissions →</Link>}
              </div>
            )}
            {tab === 'result' && !result && (
              <p className="text-slate-600 text-sm">Submit your solution to see results here.</p>
            )}
            {tab === 'history' && (
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-slate-600 text-sm">No previous submissions for this task.</p>
                ) : (
                  history.map(s => {
                    const stCls = s.status === 'Accepted' ? 'text-green-400' : s.status === 'Rejected' ? 'text-red-400' : 'text-yellow-400'
                    return (
                      <div key={s.id} className="rounded-xl bg-white/5 border border-white/10 p-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${stCls}`}>{s.status}</span>
                          <span className="text-[10px] text-slate-500">{new Date(s.createdAt).toLocaleString()}</span>
                        </div>
                        {s.marks != null && <p className="text-[10px] text-slate-400 mt-1">Marks: {s.marks}</p>}
                        {s.feedback && <p className="text-xs text-slate-300 mt-2 bg-black/40 p-2 rounded">{s.feedback}</p>}
                        {s.versions?.length > 0 && task.type === 'CODE' && (
                          <button onClick={() => {
                             setCode(s.versions[s.versions.length - 1].code)
                             setTab('problem')
                          }} className="text-[10px] text-cyan-400 mt-2 hover:underline">
                            Load this code into editor
                          </button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel — Editor or Answer Panel */}
        <div className="lg:flex-1 flex flex-col gap-4">
          
          {/* GENERAL TYPE VIEW — Monaco plaintext editor */}
          {task.type === 'GENERAL' && (
            <div className="glass-card rounded-2xl flex flex-col gap-0 flex-1 overflow-hidden" style={{ minHeight: 400 }}>
              {/* Header bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 opacity-60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-60" />
                  <span className="text-xs font-semibold ml-2" style={{ color: 'var(--text-secondary)' }}>
                    Your Written Answer
                  </span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  {generalAnswer.length} chars · {generalAnswer.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              {/* Monaco in plaintext */}
              <div className="flex-1" style={{ minHeight: 360 }}>
                <Editor
                  height="100%"
                  language="plaintext"
                  theme={ideTheme === 'dark' ? 'vs-dark' : ideTheme}
                  value={generalAnswer}
                  onChange={v => setGeneralAnswer(v || '')}
                  options={{
                    fontSize: 14,
                    fontFamily: '"Inter", system-ui, sans-serif',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    wordWrap: 'on',
                    lineNumbers: 'off',
                    automaticLayout: true,
                    renderLineHighlight: 'none',
                    hideCursorInOverviewRuler: true,
                    scrollbar: { vertical: 'auto', horizontal: 'hidden' },
                    readOnly: isCompleted,
                  }}
                />
              </div>
            </div>
          )}


          {/* CODE TYPE VIEW WITH COMPILER SELECTOR & LIVE SANDBOX RUNNER */}
          {task.type === 'CODE' && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="glass-card rounded-2xl overflow-hidden flex flex-col flex-1" style={{ minHeight: 450 }}>
                {/* Editor Header / Compiler Language Dropdown */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Language:</span>
                    <select
                      value={lang}
                      onChange={e => handleLanguageChange(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="python">🐍 Python 3</option>
                      <option value="c">💿 C (GCC)</option>
                    </select>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">solution.{lang === 'c' ? 'c' : 'py'}</span>
                </div>

                <div className="flex-1 relative bg-[#1e1e1e]">
                  <Editor
                    height="320px"
                    language={lang}
                    theme={ideTheme === 'dark' ? 'vs-dark' : ideTheme}
                    value={code}
                    onChange={v => setCode(v || '')}
                    onMount={e => { editorRef.current = e }}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      padding: { top: 12, bottom: 12 },
                      lineNumbers: 'on',
                      renderLineHighlight: 'gutter',
                      fontLigatures: true,
                      fontFamily: '"Fira Code", monospace',
                      readOnly: isCompleted,
                    }}
                  />
                  <div className="absolute bottom-3 right-4 text-[10px] opacity-40 pointer-events-none text-slate-500 z-10">
                    Ctrl+Enter to run
                  </div>
                </div>

                {/* Console Toggle Bar */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-slate-950/40">
                  <button
                    onClick={() => setShowConsole(!showConsole)}
                    className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {showConsole ? '▼ Close Console' : '▲ Show Interactive Console'}
                  </button>
                  {runResult && (
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      runResult.exitCode === 0 && !runResult.compileError ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {runResult.exitCode === 0 && !runResult.compileError ? 'Success' : 'Failed'}
                    </span>
                  )}
                </div>

                {/* Interactive Console Drawer */}
                {showConsole && (
                  <div className="border-t border-white/5 bg-slate-950 p-4 space-y-4 max-h-60 overflow-y-auto">
                    {/* Custom Input */}
                    {showInput && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-cyan-500 font-bold uppercase tracking-wider block">input:</label>
                        <textarea
                          rows={2}
                          value={customInput}
                          onChange={e => setCustomInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              runCode()
                            }
                          }}
                          placeholder="Provide stdin input for compilation/execution here..."
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 resize-none"
                        />
                      </div>
                    )}

                    {/* Compilation / Run Output terminal logs */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Execution Output</label>
                      <div className="bg-black/80 rounded-xl p-3.5 border border-white/5 min-h-[60px] font-mono text-xs overflow-auto whitespace-pre-wrap leading-relaxed">
                        {running && <span className="text-cyan-400 animate-pulse block">⏳ Compiling & Running solution on local Sandbox...</span>}
                        {!running && !runResult && <span className="text-slate-600 italic block">No output to display. Click "Run Code" below.</span>}
                        {runResult && (
                          <div className="space-y-2">
                            {runResult.compileError && (
                              <div className="text-red-400 font-bold">
                                ❌ Compilation Error:
                              </div>
                            )}
                            {runResult.stderr && (
                              <div className="text-red-400">
                                {runResult.stderr}
                              </div>
                            )}
                            {runResult.stdout && (
                              <div className="text-green-300">
                                {runResult.stdout}
                              </div>
                            )}
                            {runResult.error && (
                              <div className="text-amber-400 font-bold">
                                Error: {runResult.error}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500 border-t border-white/5 pt-1.5 mt-2 flex items-center justify-between">
                              <span>Exit Code: {runResult.exitCode}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QUIZ (ONE-MARK) TYPE VIEW */}
          {task.type === 'QUIZ' && (
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 flex-1 max-h-[500px] overflow-y-auto" style={{ minHeight: 400 }}>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">One-Mark Questions</span>
                <span className="text-xs text-slate-500">
                  {Object.keys(quizAnswers).length} / {task.quizQuestions?.length} answered
                </span>
              </div>

              <div className="space-y-6">
                {(task.quizQuestions || []).map((q, idx) => {
                  let opts = []
                  try {
                    opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
                  } catch (e) {}
                  
                  return (
                    <div key={q.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-white">
                        <span className="text-purple-400 mr-1.5">{idx + 1}.</span> {q.question}
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {opts.map((opt, oIdx) => {
                          const isSelected = quizAnswers[q.id] === opt
                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleSelectQuizOption(q.id, opt)}
                              className={`text-left text-xs px-4 py-3 rounded-xl border transition-all ${
                                isSelected
                                  ? 'bg-purple-500/10 border-purple-500 text-purple-300 font-bold'
                                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                              } ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={isCompleted}
                            >
                              <span className="font-mono text-purple-400 mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-4">
            {isCompleted ? (
              <div className="w-full text-center py-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold">
                ✓ Task Already Completed
              </div>
            ) : (
              <>
                {task.type === 'CODE' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLanguageChange(lang)}
                      className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      onClick={runCode}
                      disabled={running}
                      className="rounded-xl bg-cyan-600/10 border border-cyan-500/30 px-5 py-2.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50 transition-all"
                    >
                      {running ? '⏳ Running...' : '▶ Run Code (Ctrl+Enter)'}
                    </button>
                  </div>
                )}
                <button onClick={submit} disabled={submitting}
                  className="btn-glow flex-1 sm:flex-none rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-8 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 ml-auto">
                  {submitting ? '⏳ Submitting…' : '🚀 Submit Solution'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
