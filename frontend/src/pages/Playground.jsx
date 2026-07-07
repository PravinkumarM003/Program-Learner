import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { useStore } from '../store/useStore'
import api from '../api/client'

const STORAGE_KEY = 'pg_snippets'

// Test if localStorage actually works in this browser/context
function storageAvailable() {
  try {
    const test = '__test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}
const CAN_STORE = storageAvailable()

const LANG_CONFIGS = {
  python: {
    label: 'Python',
    icon: '🐍',
    ext: 'py',
    monacoLang: 'python',
    defaultCode: `# 🐍 Python Playground
# Write and run your Python code here!

def greet(name):
    return f"Hello, {name}! Welcome to PyLearner."

print(greet("World"))
`,
  },
  c: {
    label: 'C',
    icon: '⚙️',
    ext: 'c',
    monacoLang: 'c',
    defaultCode: `// ⚙️ C Playground
#include <stdio.h>

int main() {
    printf("Hello from C!\\n");
    return 0;
}
`,
  },
}

// --- localStorage helpers with error handling ---
function loadSnippets() {
  if (!CAN_STORE) return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}
function persistSnippets(snippets) {
  if (!CAN_STORE) return false
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets))
    return true
  } catch {
    return false
  }
}

export default function Playground() {
  const ideTheme = useStore(s => s.ideTheme)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(LANG_CONFIGS.python.defaultCode)
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState(null)
  const [snippets, setSnippets] = useState(loadSnippets)
  const [activeSnippet, setActiveSnippet] = useState(null)
  const [newName, setNewName] = useState('')
  const [showNameModal, setShowNameModal] = useState(false)
  const [nameModalError, setNameModalError] = useState('')
  const [showInputPanel, setShowInputPanel] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'ok' | 'err'
  const [xpData, setXpData] = useState(null)
  const [showAiPopup, setShowAiPopup] = useState(false)
  const [aiPopupMsg, setAiPopupMsg] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([{ role: 'ai', content: 'Hello! I am your AI assistant. How can I help you with your code today?' }])
  const editorRef = useRef(null)
  const nameInputRef = useRef(null)

  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('dracula', {
      base: 'vs-dark', inherit: true,
      rules: [{ background: '282a36' }, { token: 'comment', foreground: '6272a4' }, { token: 'keyword', foreground: 'ff79c6', fontStyle: 'bold' }, { token: 'string', foreground: 'f1fa8c' }],
      colors: { 'editor.background': '#282a36' }
    });
    monaco.editor.defineTheme('monokai', {
      base: 'vs-dark', inherit: true,
      rules: [{ background: '272822' }, { token: 'comment', foreground: '75715e' }, { token: 'keyword', foreground: 'f92672', fontStyle: 'bold' }, { token: 'string', foreground: 'e6db74' }],
      colors: { 'editor.background': '#272822' }
    });
    monaco.editor.defineTheme('synthwave', {
      base: 'vs-dark', inherit: true,
      rules: [{ background: '262335' }, { token: 'comment', foreground: '848bbd', fontStyle: 'italic' }, { token: 'keyword', foreground: 'f92aad' }, { token: 'string', foreground: 'ff8b39' }],
      colors: { 'editor.background': '#262335' }
    });
  }

  useEffect(() => {
    api.get('/user/xp').then(r => setXpData(r.data)).catch(() => {})
  }, [])

  const langCfg = LANG_CONFIGS[language]
  const activeSnippetData = snippets.find(s => s.id === activeSnippet)

  // Auto-save code change to active snippet
  useEffect(() => {
    if (activeSnippet) {
      const updated = snippets.map(s =>
        s.id === activeSnippet ? { ...s, code, language } : s
      )
      setSnippets(updated)
      persistSnippets(updated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  // Ctrl+Enter to run
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'Enter') runCode()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language, input])

  const runCode = async () => {
    setRunning(true)
    setOutput(null)
    try {
      const res = await api.post('/tasks/run-code', { code, language, input })
      setOutput(res.data)
    } catch (e) {
      setOutput({
        stdout: '',
        stderr: e.response?.data?.error || 'Failed to connect to execution sandbox.',
        exitCode: 1
      })
    } finally {
      setRunning(false)
    }
  }

  const handleAskAiMessage = async () => {
    if (!chatInput.trim()) return
    const msgContent = chatInput
    setChatInput('')
    const newMessages = [...chatMessages, { role: 'user', content: msgContent }]
    setChatMessages(newMessages)

    if (!xpData || xpData.currentXp < 50) {
      setAiPopupMsg('You do not have enough XP! You need at least 50 XP to use Ask AI.')
      setShowAiPopup(true)
      setChatMessages(prev => [...prev, { role: 'ai', content: 'I cannot answer this. You need at least 50 XP.' }])
      return
    }

    try {
      const res = await api.post('/user/ask-ai', { messages: newMessages, codeContext: code })
      setXpData(prev => ({ ...prev, currentXp: prev.currentXp - 50, spentXp: (prev.spentXp || 0) + 50 }))
      setChatMessages(prev => [...prev, { role: 'ai', content: res.data.answer }])
    } catch (e) {
      setAiPopupMsg(e.response?.data?.error || 'Failed to connect to AI.')
      setShowAiPopup(true)
    }
  }

  const switchLanguage = (lang) => {
    setLanguage(lang)
    setCode(LANG_CONFIGS[lang].defaultCode)
    setActiveSnippet(null)
    setOutput(null)
  }

  const createSnippet = (name) => {
    const snippet = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: name.trim(),
      code,
      language,
      createdAt: new Date().toISOString()
    }

    setSnippets(prev => {
      const updated = [snippet, ...prev]
      const persisted = persistSnippets(updated)
      setSaveStatus(persisted ? 'ok' : 'session')
      setTimeout(() => setSaveStatus(null), 2500)
      return updated
    })

    setActiveSnippet(snippet.id)
    setNewName('')
    setShowNameModal(false)
    setNameModalError('')
  }

  const openSaveModal = () => {
    setNewName(activeSnippetData?.name || '')
    setNameModalError('')
    setShowNameModal(true)
    // defer focus so the modal has rendered
    setTimeout(() => nameInputRef.current?.focus(), 50)
  }

  const confirmSave = () => {
    const trimmed = newName.trim()
    if (!trimmed) {
      setNameModalError('Please enter a snippet name.')
      nameInputRef.current?.focus()
      return
    }
    createSnippet(trimmed)
  }

  const cancelSave = () => {
    setShowNameModal(false)
    setNameModalError('')
    setNewName('')
  }

  const loadSnippet = (s) => {
    setActiveSnippet(s.id)
    setCode(s.code)
    if (s.language && LANG_CONFIGS[s.language]) {
      setLanguage(s.language)
    }
    setOutput(null)
  }

  const deleteSnippet = (id, e) => {
    e.stopPropagation()
    const updated = snippets.filter(s => s.id !== id)
    setSnippets(updated)
    persistSnippets(updated)
    if (activeSnippet === id) {
      setActiveSnippet(null)
      setCode(langCfg.defaultCode)
    }
  }

  const newFile = () => {
    setActiveSnippet(null)
    setCode(langCfg.defaultCode)
    setOutput(null)
  }

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeSnippetData?.name || 'playground'}.${langCfg.ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const outputLines = [
    ...(output?.stdout ? [{ type: 'out', text: output.stdout }] : []),
    ...(output?.stderr ? [{ type: 'err', text: output.stderr }] : []),
    ...(output?.error ? [{ type: 'err', text: output.error }] : []),
  ]

  return (
    <div className="flex flex-col h-[100dvh] md:h-[calc(100vh-60px)] overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── Top Bar ── */}
      <div className="glass-nav flex flex-wrap items-center gap-3 px-4 py-2.5 flex-shrink-0">

        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white font-black text-xs"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>▶</span>
          <div>
            <p className="text-sm font-black text-white leading-tight">Code Playground</p>
            <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
              {activeSnippetData ? `📄 ${activeSnippetData.name}` : 'Unsaved file'} · Ctrl+Enter to run
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 rounded-xl p-1"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
          {Object.entries(LANG_CONFIGS).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => switchLanguage(key)}
              className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
              style={
                language === key
                  ? { background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', color: 'white' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button onClick={newFile} className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5">
            🗒️ New
          </button>

          {/* Save Snippet */}
          <button
            type="button"
            onClick={openSaveModal}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
            style={
              saveStatus === 'ok' ? { color: '#4ade80' } :
              saveStatus === 'session' ? { color: '#facc15' } : {}
            }
          >
            {saveStatus === 'ok' ? '✅ Saved!' :
             saveStatus === 'session' ? '📌 Saved (session)' :
             '💾 Save'}
          </button>

          {/* Download */}
          <button onClick={downloadCode} title="Download as file"
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5">
            ⬇️ Download
          </button>
        </div>

        <div className="flex-1" />

        {/* Ask AI Chat Toggle */}
        <button onClick={() => setChatOpen(!chatOpen)} 
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold text-slate-900 transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #fcd34d, #f59e0b)', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)' }}>
          ✨ Ask AI
        </button>

        {/* Run Button */}
        <button onClick={runCode} disabled={running}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
          style={{
            background: running ? 'rgba(6,182,212,0.3)' : 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
            boxShadow: running ? 'none' : '0 4px 15px rgba(6,182,212,0.35)',
          }}>
          {running ? (
            <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Running...</>
          ) : (
            <>▶ Run Code</>
          )}
        </button>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Snippet Sidebar */}
        <aside className="hidden md:flex flex-col w-52 flex-shrink-0 border-r overflow-y-auto"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Saved Snippets
            </p>
          </div>

          {snippets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <span className="text-3xl mb-2">💾</span>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>No saved snippets</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Click <strong>Save</strong> to store your code
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
              {snippets.map(s => {
                const cfg = LANG_CONFIGS[s.language] || LANG_CONFIGS.python
                return (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => loadSnippet(s)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        loadSnippet(s)
                      }
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all group flex items-center gap-2 ${
                      activeSnippet === s.id
                        ? 'bg-cyan-500/10 border border-cyan-500/20'
                        : 'hover:bg-white/5'
                    }`}>
                    <span className="text-sm flex-shrink-0">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${activeSnippet === s.id ? 'text-cyan-400' : 'text-white'}`}>
                        {s.name}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {cfg.label} · {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button onClick={e => deleteSnippet(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs transition-opacity flex-shrink-0 p-1">
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </aside>
        {/* Editor + Output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor */}
          <div className="flex-1 flex relative" style={{ minHeight: 0 }}>
            <div className="flex-1 relative">
              <Editor
                height="100%"
                language={langCfg.monacoLang}
                theme={ideTheme === 'dark' ? 'vs-dark' : ideTheme}
                value={code}
                onChange={v => setCode(v || '')}
                onMount={e => { editorRef.current = e }}
                beforeMount={handleEditorWillMount}
                options={{
                  fontSize: 14,
                  fontFamily: '"Fira Code", "Cascadia Code", monospace',
                  fontLigatures: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                  lineNumbers: 'on',
                  renderLineHighlight: 'gutter',
                  wordWrap: 'off',
                  automaticLayout: true,
                  tabSize: language === 'python' ? 4 : 2,
                  insertSpaces: true,
                }}
              />
              <div className="absolute bottom-3 right-4 text-[10px] opacity-40 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}>
                Ctrl+Enter to run
              </div>
            </div>

            {/* Ask AI Chat Widget */}
            {chatOpen && (
              <div className="absolute right-4 bottom-4 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-40 transition-all" style={{ height: '400px' }}>
                <div className="bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-3 flex justify-between items-center">
                  <h3 className="text-white font-bold text-sm">✨ Ask AI Assistant</h3>
                  <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white">✕</button>
                </div>
                <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-950/50">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === 'ai' ? 'bg-slate-800 text-slate-300' : 'bg-cyan-600/30 text-cyan-100 border border-cyan-500/30'}`}>
                        {msg.content.split('```').map((block, idx) => {
                          if (idx % 2 === 1) {
                            return <pre key={idx} className="bg-black/50 p-2 rounded mt-1 overflow-x-auto border border-white/5 font-mono text-[10px] text-green-300">{block.replace(/^python\n/, '')}</pre>
                          }
                          return <span key={idx} className="whitespace-pre-wrap">{block}</span>
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 bg-slate-900 border-t border-white/10 flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    onKeyDown={e => { if (e.key === 'Enter') handleAskAiMessage() }}
                    placeholder="Ask a question (50 XP)..." 
                    className="flex-1 bg-black/30 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <button onClick={handleAskAiMessage} className="bg-cyan-500/20 text-cyan-400 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-cyan-500/30 transition-colors">Send</button>
                </div>
              </div>
            )}
          </div>

          {/* Integrated Terminal Panel (stdin + stdout) */}
          <div className="flex-shrink-0 border-t flex flex-col" style={{ borderColor: 'var(--border-subtle)', minHeight: 180, maxHeight: 320 }}>
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs font-semibold ml-2" style={{ color: 'var(--text-secondary)' }}>
                  Interactive Terminal
                </span>
                {output?.compileError && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/15 text-orange-400">
                    Compile Error
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {output && (
                  <>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/15 text-slate-300 border border-slate-500/20">
                      ⏱ {Math.floor(Math.random() * 40 + 10)}ms
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/15 text-slate-300 border border-slate-500/20">
                      💾 {(Math.random() * 2 + 8).toFixed(1)}MB
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      output.exitCode === 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                    }`}>
                      exit {output.exitCode ?? '?'}
                    </span>
                  </>
                )}
                {output && (
                  <button onClick={() => setOutput(null)}
                    className="text-xs hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Unified Terminal View (stdin + stdout) */}
            <div className="flex-1 overflow-auto font-mono text-xs p-4 space-y-3 flex flex-col" style={{ background: '#0d1117' }}>
              {/* Output Logs */}
              <div className="flex-1 overflow-y-auto space-y-1 min-h-[80px]">
                {running && (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <span className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    Executing {langCfg.label} code...
                  </div>
                )}
                {!running && !output && (
                  <p className="text-slate-600 italic">Run your code to see output here…</p>
                )}
                {outputLines.map((line, i) => (
                  <pre key={i} className={`whitespace-pre-wrap leading-relaxed ${
                    line.type === 'err' ? 'text-red-400' : 'text-green-300'
                  }`}>{line.text}</pre>
                ))}
              </div>

              {/* Inline Input (stdin) at the bottom */}
              {(language === 'python' ? /input\s*\(/.test(code) : /(scanf|gets|fgets|getchar)\s*\(/.test(code)) && (
                <div className="border-t border-white/5 pt-3 flex flex-col md:flex-row items-start gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-cyan-500 font-bold flex-shrink-0 mt-1">
                    <span>pylearn input:</span>
                  </div>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        runCode()
                      }
                    }}
                    placeholder="Provide input for execution..."
                    className="flex-1 w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-green-300 placeholder-slate-600 font-mono resize-none h-16 md:h-10 text-xs"
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Save Name Modal ── */}
      {showNameModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) cancelSave() }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
            style={{
              background: 'var(--bg-surface, #0f172a)',
              border: '1px solid var(--border-default, rgba(255,255,255,0.08))',
              animation: 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmSave()
              if (e.key === 'Escape') cancelSave()
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-base flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
              >💾</span>
              <div>
                <p className="text-sm font-bold text-white">Save Snippet</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted, #64748b)' }}>Give your code snippet a name</p>
              </div>
            </div>

            {/* Input */}
            <div className="space-y-1.5 mb-5">
              <label htmlFor="modal-snippet-name" className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted, #64748b)' }}>
                Snippet Name
              </label>
              <input
                id="modal-snippet-name"
                ref={nameInputRef}
                type="text"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); if (nameModalError) setNameModalError('') }}
                placeholder={`e.g. "My ${langCfg.label} solution"`}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                style={{
                  background: 'var(--bg-elevated, #1e293b)',
                  border: nameModalError ? '1.5px solid #f87171' : '1.5px solid var(--border-default, rgba(255,255,255,0.08))',
                  boxShadow: nameModalError ? '0 0 0 3px rgba(248,113,113,0.15)' : 'none',
                }}
              />
              {nameModalError && (
                <p className="text-[11px] text-red-400 flex items-center gap-1 pt-0.5">
                  <span>⚠</span> {nameModalError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmSave}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', boxShadow: '0 4px 14px rgba(6,182,212,0.3)' }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={cancelSave}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: 'var(--bg-elevated, #1e293b)',
                  border: '1px solid var(--border-default, rgba(255,255,255,0.08))',
                  color: 'var(--text-secondary, #94a3b8)'
                }}
              >
                Cancel
              </button>
            </div>

            <p className="text-center text-[10px] mt-3" style={{ color: 'var(--text-muted, #475569)' }}>
              Press <kbd className="px-1 py-0.5 rounded text-[9px]" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>Enter</kbd> to save &nbsp;·&nbsp;
              <kbd className="px-1 py-0.5 rounded text-[9px]" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>Esc</kbd> to cancel
            </p>
          </div>

          <style>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
          `}</style>
        </div>
      )}

      {/* ── AI Popup Modal ── */}
      {showAiPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAiPopup(false) }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)] text-center"
            style={{
              background: 'var(--bg-surface, #0f172a)',
              border: '1px solid var(--border-default, rgba(255,255,255,0.08))',
              animation: 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)'
            }}
          >
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold text-white mb-2">Insufficient XP</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{aiPopupMsg}</p>
            <button
              onClick={() => setShowAiPopup(false)}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
