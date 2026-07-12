import api from '../api/client'
import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'

const STATUS_MAP = {
  Pending:     'bg-yellow-500/10 text-yellow-400',
  UnderReview: 'bg-blue-500/10 text-blue-400',
  Accepted:    'bg-green-500/10 text-green-400',
  Rejected:    'bg-red-500/10 text-red-400',
}

const TYPE_MAP = {
  GENERAL: 'bg-teal-500/10 text-teal-400 ring-teal-500/20',
  CODE:    'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
  QUIZ:    'bg-purple-500/10 text-purple-400 ring-purple-500/20',
}

const getDateKey = (value) => new Date(value).toLocaleDateString()

const getDateLabel = (value) => {
  const date = new Date(value)
  const today = new Date()

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminDashboard() {
  const user = useStore(s => s.user)
  const showToast = useStore(s => s.showToast)
  const [subs, setSubs] = useState([])
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])
  const [lessons, setLessons] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('tasks')
  const [changingRoleId, setChangingRoleId] = useState(null)
  const [settingDailyId, setSettingDailyId] = useState(null)
  
  // Set correct initial tab when user loads
  useEffect(() => {
    if (user?.role === 'TEACHER') {
      setTab('content-manager')
    } else if (user?.role === 'ADMIN') {
      setTab('overview')
    }
  }, [user])
  const [selectedSub, setSelectedSub] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [marks, setMarks] = useState('')
  const [savingSub, setSavingSub] = useState(false)
  const [msg, setMsg] = useState(null)

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [sendingBroadcast, setSendingBroadcast] = useState(false)
  const [broadcasts, setBroadcasts] = useState([])

  const fetchBroadcasts = async () => {
    try {
      const res = await api.get('/admin/notifications/broadcast')
      setBroadcasts(res.data?.broadcasts || [])
    } catch (e) {}
  }

  const deleteBroadcast = async (title, body) => {
    if (!window.confirm(`Are you sure you want to delete the broadcast "${title}"?`)) return
    try {
      await api.delete('/admin/notifications/broadcast', { data: { title, body } })
      setBroadcasts(prev => prev.filter(b => !(b.title === title && b.body === body)))
      showToast('Broadcast deleted successfully!', 'success')
    } catch (err) {
      showToast('Failed to delete broadcast.', 'error')
    }
  }



  // Give XP state
  const [giveXpUserId, setGiveXpUserId] = useState('')
  const [giveXpAmount, setGiveXpAmount] = useState('')
  const [givingXp, setGivingXp] = useState(false)

  const handleGiveXp = async (e) => {
    e.preventDefault()
    if (!giveXpUserId || !giveXpAmount) return
    setGivingXp(true)
    try {
      await api.post(`/admin/users/${giveXpUserId}/xp`, { xp: Number(giveXpAmount) })
      setMsg({ ok: true, text: `Successfully gave ${giveXpAmount} XP!` })
      setGiveXpUserId('')
      setGiveXpAmount('')
      fetchUsers() // Refresh user data
    } catch (err) {
      setMsg({ ok: false, text: 'Failed to give XP.' })
    } finally {
      setGivingXp(false)
    }
  }

  const sendBroadcast = async (e) => {
    e.preventDefault()
    setSendingBroadcast(true)
    try {
      await api.post('/admin/notifications/broadcast', { title: broadcastTitle, message: broadcastMessage })
      setMsg({ ok: true, text: 'Broadcast sent successfully!' })
      setBroadcastTitle('')
      setBroadcastMessage('')
      fetchBroadcasts() // Refresh the list
    } catch(e) {
      setMsg({ ok: false, text: 'Failed to send broadcast.' })
    } finally {
      setSendingBroadcast(false)
    }
  }

  // Task Form State
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskLangPrompt, setTaskLangPrompt] = useState(false)   // language picker before task modal
  const [lessonLangPrompt, setLessonLangPrompt] = useState(false) // language picker before lesson modal
  const [editingTask, setEditingTask] = useState(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskType, setTaskType] = useState('CODE')
  const [taskDiff, setTaskDiff] = useState('Beginner')
  const [taskDeadline, setTaskDeadline] = useState('')
  const [taskStarterCode, setTaskStarterCode] = useState('')
  const [taskSampleInput, setTaskSampleInput] = useState('')
  const [taskSampleOutput, setTaskSampleOutput] = useState('')
  const [taskTestCases, setTaskTestCases] = useState([])
  const [taskHints, setTaskHints] = useState('')
  const [taskBaseXp, setTaskBaseXp] = useState(0)
  const [taskTargetTime, setTaskTargetTime] = useState('')
  const [taskMaxMarks, setTaskMaxMarks] = useState('')
  const [taskCourseId, setTaskCourseId] = useState('')
  const [taskCategory, setTaskCategory] = useState('C')
  const [quizQuestions, setQuizQuestions] = useState([])
  const [savingTask, setSavingTask] = useState(false)

  // Test Case Helpers
  const addTestCase = () => setTaskTestCases(prev => [...prev, { input: '', output: '' }])
  const removeTestCase = (idx) => setTaskTestCases(prev => prev.filter((_, i) => i !== idx))
  const handleTestCaseChange = (idx, field, val) => setTaskTestCases(prev => prev.map((tc, i) => i === idx ? { ...tc, [field]: val } : tc))


  // Lesson Form State
  const [editingLesson, setEditingLesson] = useState(null)
  const [lessonModalOpen, setLessonModalOpen] = useState(false)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonNotes, setLessonNotes] = useState('')
  const [lessonVideoUrl, setLessonVideoUrl] = useState('')
  const [lessonDifficulty, setLessonDifficulty] = useState('Beginner')
  const [lessonCategory, setLessonCategory] = useState('C')
  const [savingLesson, setSavingLesson] = useState(false)

  // Content Manager State
  const [contentTrack, setContentTrack] = useState('C')


  // Violations & Feedback State
  const [violations, setViolations] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [blockedIps, setBlockedIps] = useState([])
  const [blockIp, setBlockIp] = useState('')
  const [blockReason, setBlockReason] = useState('')

  // Pagination State
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotalPages, setUsersTotalPages] = useState(1)
  const [subsPage, setSubsPage] = useState(1)
  const [subsTotalPages, setSubsTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 20

  const fetchAllData = () => {
    setLoading(true)
    const requests = [
      api.get('/admin/submissions').catch(() => ({ data: { submissions: [] } })),
      api.get('/tasks/admin').catch(() => ({ data: { tasks: [] } })),
      api.get('/admin/lessons').catch(() => ({ data: { lessons: [] } })),
      api.get('/courses').catch(() => ({ data: { courses: [] } }))
    ]
    if (user?.role === 'ADMIN') {
      requests.push(api.get('/user/leaderboard').catch(() => ({ data: { leaderboard: [] } })))
      requests.push(api.get('/admin/violations').catch(() => ({ data: { violations: [] } })))
      requests.push(api.get('/admin/blocked-ips').catch(() => ({ data: { blockedIps: [] } })))
      requests.push(api.get('/feedback').catch(() => ({ data: { feedbacks: [] } })))
      requests.push(api.get('/admin/notifications/broadcast').catch(() => ({ data: { broadcasts: [] } })))
    }
    
    Promise.all(requests).then((responses) => {
      // Submissions will be fetched by its own effect
      setTasks(responses[1].data?.tasks || [])
      setLessons(responses[2].data?.lessons || [])
      setCourses(responses[3].data?.courses || [])
      
      if (user?.role === 'ADMIN') {
        const lb = responses[4]
        const v = responses[5]
        const b = responses[6]
        const f = responses[7]
        const br = responses[8]
        setViolations(v.data?.violations || [])
        setBlockedIps(b.data?.blockedIps || [])
        setFeedbacks(f.data?.feedbacks || [])
        setBroadcasts(br.data?.broadcasts || [])
        
        // Users will be fetched by its own effect, we'll store leaderboard data to merge later
        // Just setting leaderboard is not enough, we need it in a state or ref.
        // Actually, let's fetch leaderboard again in fetchUsers or set a state for it.
        // For simplicity, we just fetch users with pagination independently.
      }
    }).finally(() => setLoading(false))
  }

  const fetchUsers = async () => {
    if (user?.role !== 'ADMIN') return;
    try {
      const [uRes, lbRes] = await Promise.all([
        api.get(`/admin/users?page=${usersPage}&limit=${ITEMS_PER_PAGE}`),
        api.get('/user/leaderboard')
      ]);
      const leaderboard = lbRes.data?.leaderboard || [];
      const usersData = (uRes.data?.users || []).map(usr => {
        const boardMatch = leaderboard.find(x => x.id === usr.id);
        return { ...usr, combinedScore: boardMatch ? boardMatch.score : 0 };
      });
      setUsers(usersData);
      setUsersTotalPages(uRes.data?.totalPages || 1);
    } catch (e) {
      console.error(e);
    }
  }

  const fetchSubs = async () => {
    try {
      const res = await api.get(`/admin/submissions?page=${subsPage}&limit=${ITEMS_PER_PAGE}`);
      setSubs(res.data?.submissions || []);
      setSubsTotalPages(res.data?.totalPages || 1);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchAllData()
    fetchUsers()
    fetchSubs()
  }, [user])

  useEffect(() => {
    fetchUsers()
  }, [usersPage])

  useEffect(() => {
    fetchSubs()
  }, [subsPage])

  const openReview = (s) => {
    setSelectedSub(s)
    setFeedback(s.feedback || '')
    setMarks(s.marks ?? '')
    setMsg(null)
  }

  const changeRole = async (userId, newRole) => {
    setChangingRoleId(userId)
    try {
      const r = await api.patch(`/admin/users/${userId}/role`, { role: newRole })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: r.data.user.role } : u))
      setMsg({ ok: true, text: `Role updated to ${newRole}` })
      setTimeout(() => setMsg(null), 3000)
    } catch {
      setMsg({ ok: false, text: 'Failed to update role.' })
    } finally {
      setChangingRoleId(null)
    }
  }

  const setDailyChallenge = async (taskId) => {
    setSettingDailyId(taskId)
    try {
      await api.patch(`/tasks/${taskId}/daily`)
      setTasks(prev => prev.map(t => ({ ...t, isDailyChallenge: t.id === taskId })))
      setMsg({ ok: true, text: '🔥 Daily Challenge set! All students notified.' })
      setTimeout(() => setMsg(null), 4000)
    } catch {
      setMsg({ ok: false, text: 'Failed to set daily challenge.' })
    } finally {
      setSettingDailyId(null)
    }
  }

  const saveReview = (status) => {
    setSavingSub(true)
    api.post(`/admin/submissions/${selectedSub.id}/review`, {
      status,
      feedback,
      marks: marks !== '' ? Number(marks) : null
    })
      .then(r => {
        const updated = r.data?.submission
        // Merge carefully: preserve the original task/user nested objects
        setSubs(prev => prev.map(s =>
          s.id === selectedSub.id
            ? {
                ...s,
                status: updated?.status ?? status,
                marks: updated?.marks ?? (marks !== '' ? Number(marks) : s.marks),
                feedback: updated?.feedback ?? feedback,
                earnedXp: updated?.earnedXp ?? s.earnedXp,
                reviewedAt: updated?.reviewedAt ?? new Date().toISOString(),
                // preserve nested task/user from original
                task: s.task,
                user: s.user,
              }
            : s
        ))
        setSelectedSub(null)
        setMsg({ ok: true, text: `✅ Submission marked as ${status}` })
        setTimeout(() => setMsg(null), 3000)
      })
      .catch(() => {
        setMsg({ ok: false, text: 'Failed to save. Try again.' })
        setTimeout(() => setMsg(null), 3000)
      })
      .finally(() => setSavingSub(false))
  }

  const openCreateTask = (lang) => {
    setEditingTask(null)
    setTaskTitle('')
    setTaskDesc('')
    setTaskType('CODE')
    setTaskDiff('Beginner')
    setTaskDeadline('')
    setTaskStarterCode('')
    setTaskSampleInput('')
    setTaskSampleOutput('')
    setTaskTestCases([])
    setTaskHints('')
    setTaskBaseXp(0)
    setTaskTargetTime('')
    setTaskMaxMarks('')
    setTaskCourseId('')
    setQuizQuestions([])
    setTaskCategory(lang || 'C')  // reset to chosen language
    setTaskLangPrompt(false)
    setTaskModalOpen(true)
  }

  const openEditTask = async (task) => {
    try {
      setLoading(true)
      const res = await api.get(`/tasks/admin/${task.id}`)
      const fullTask = res.data?.task
      if (!fullTask) return

      setEditingTask(fullTask)
      setTaskTitle(fullTask.title || '')
      setTaskDesc(fullTask.description || '')
      setTaskType(fullTask.type || 'CODE')
      setTaskDiff(fullTask.difficulty || 'Beginner')
      setTaskDeadline(fullTask.deadline ? new Date(fullTask.deadline).toISOString().split('T')[0] : '')
      setTaskStarterCode(fullTask.starterCode || '')
      setTaskSampleInput(fullTask.sampleInput || '')
      setTaskSampleOutput(fullTask.sampleOutput || '')
      setTaskCategory(fullTask.category || 'C')
      
      let parsedTC = []
      try {
        if (fullTask.testCases) parsedTC = JSON.parse(fullTask.testCases)
      } catch(e) {}
      setTaskTestCases(Array.isArray(parsedTC) ? parsedTC : [])
      
      setTaskHints(fullTask.hints || '')
      setTaskBaseXp(fullTask.baseXp || 0)
      setTaskTargetTime(fullTask.targetTime || '')
      setTaskMaxMarks(fullTask.maxMarks || '')
      setTaskCourseId(fullTask.courseId || '')
      
      const parsedQuestions = (fullTask.quizQuestions || []).map(q => {
        let opts = ['', '', '', '']
        try {
          opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        } catch (e) {}
        return { question: q.question || '', options: opts, answer: q.answer || '' }
      })
      setQuizQuestions(parsedQuestions)
      setTaskModalOpen(true)
    } catch (e) {
      setMsg({ ok: false, text: 'Failed to load task details.' })
    } finally {
      setLoading(false)
    }
  }

  const saveTask = (e) => {
    e.preventDefault()
    if (!taskTitle || !taskDesc) {
      showToast('Please fill out Title and Description.', 'warning')
      return
    }
    setSavingTask(true)
    const formattedQuestions = taskType === 'QUIZ' ? quizQuestions.map(q => ({
      question: q.question,
      options: q.options.filter(o => o.trim() !== ''),
      answer: q.answer
    })) : []

    const payload = {
      title: taskTitle, description: taskDesc, type: taskType, difficulty: taskDiff,
      deadline: taskDeadline ? new Date(taskDeadline).toISOString() : null, starterCode: taskStarterCode, sampleInput: taskSampleInput,
      sampleOutput: taskSampleOutput, testCases: JSON.stringify(taskTestCases), hints: taskHints,
      baseXp: Number(taskBaseXp) || 0,
      targetTime: taskTargetTime ? Number(taskTargetTime) : null,
      maxMarks: taskMaxMarks ? Number(taskMaxMarks) : null,
      courseId: taskCourseId || null,
      category: taskCategory,
      quizQuestions: formattedQuestions, isDraft: false
    }

    const request = editingTask ? api.put(`/tasks/${editingTask.id}`, payload) : api.post('/tasks', payload)

    request.then(() => {
      setTaskModalOpen(false)
      setMsg({ ok: true, text: `Task successfully ${editingTask ? 'updated' : 'created'}!` })
      setTimeout(() => setMsg(null), 3000)
      fetchAllData()
    }).catch(() => {
      setMsg({ ok: false, text: 'Failed to save task.' })
      setTimeout(() => setMsg(null), 3000)
    })
      .finally(() => setSavingTask(false))
  }

  const deleteTask = (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    api.delete(`/tasks/${id}`)
      .then(() => {
        setMsg({ ok: true, text: 'Task deleted successfully!' })
        setTimeout(() => setMsg(null), 3000)
        fetchAllData()
      })
      .catch(() => {
        setMsg({ ok: false, text: 'Failed to delete task.' })
        setTimeout(() => setMsg(null), 3000)
      })
  }

  // Delete lesson
  const deleteLesson = (id) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return
    api.delete(`/admin/lessons/${id}`)
      .then(() => {
        setMsg({ ok: true, text: 'Lesson deleted successfully!' })
        setTimeout(() => setMsg(null), 3000)
        fetchAllData()
      })
      .catch(() => {
        setMsg({ ok: false, text: 'Failed to delete lesson.' })
        setTimeout(() => setMsg(null), 3000)
      })
  }

  const openCreateLesson = (lang) => {
    setEditingLesson(null)
    setLessonTitle('')
    setLessonContent('')
    setLessonNotes('')
    setLessonVideoUrl('')
    setLessonDifficulty('Beginner')
    setLessonCategory(lang || 'C')
    setLessonLangPrompt(false)
    setLessonModalOpen(true)
  }

  const openEditLesson = (lesson) => {
    setEditingLesson(lesson)
    setLessonTitle(lesson.title || '')
    setLessonContent(lesson.content || '')
    setLessonNotes(lesson.notes || '')
    setLessonVideoUrl(lesson.videoUrl || '')
    setLessonDifficulty(lesson.difficulty || 'Beginner')
    setLessonCategory(lesson.category || 'C')
    setLessonLangPrompt(false)
    setLessonModalOpen(true)
  }


  const saveLesson = (e) => {
    e.preventDefault()
    if (!lessonTitle || !lessonContent) {
      showToast('Please fill out Title and Content.', 'warning')
      return
    }
    setSavingLesson(true)

    const payload = {
      title: lessonTitle, 
      content: lessonContent, 
      notes: lessonNotes,
      videoUrl: lessonVideoUrl,
      difficulty: lessonDifficulty,
      category: lessonCategory
    }


    const request = editingLesson ? api.put(`/admin/lessons/${editingLesson.id}`, payload) : api.post('/admin/lessons', payload)

    request.then(() => {
      setLessonModalOpen(false)
      setMsg({ ok: true, text: `Lesson successfully ${editingLesson ? 'updated' : 'created'}!` })
      setTimeout(() => setMsg(null), 3000)
      fetchAllData()
    }).catch(() => {
      setMsg({ ok: false, text: 'Failed to save lesson.' })
      setTimeout(() => setMsg(null), 3000)
    })
      .finally(() => setSavingLesson(false))
  }

  const addQuizQuestion = () => setQuizQuestions(prev => [...prev, { question: '', options: ['', '', '', ''], answer: '' }])
  const removeQuizQuestion = (idx) => setQuizQuestions(prev => prev.filter((_, i) => i !== idx))
  const handleQuestionChange = (idx, field, val) => setQuizQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: val } : q))
  const handleOptionChange = (qIdx, optIdx, val) => setQuizQuestions(prev => prev.map((q, i) => {
    if (i === qIdx) {
      const newOpts = [...q.options]
      newOpts[optIdx] = val
      return { ...q, options: newOpts }
    }
    return q
  }))

  const extractIp = (text = '') => {
    const match = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b|(?:::ffff:)?[a-f0-9:]{3,}/i)
    return match ? match[0].replace('::ffff:', '') : ''
  }

  const saveBlockedIp = (ip = blockIp, reason = blockReason) => {
    const normalizedIp = String(ip || '').trim()
    if (!normalizedIp) {
      setMsg({ ok: false, text: 'Enter an IP address to block.' })
      setTimeout(() => setMsg(null), 3000)
      return
    }

    api.post('/admin/blocked-ips', { ip: normalizedIp, reason })
      .then(r => {
        const blockedIp = r.data?.blockedIp
        setBlockedIps(prev => [blockedIp, ...prev.filter(item => item.ip !== normalizedIp)])
        setBlockIp('')
        setBlockReason('')
        setMsg({ ok: true, text: `Blocked IP ${normalizedIp}` })
        setTimeout(() => setMsg(null), 3000)
      })
      .catch(() => {
        setMsg({ ok: false, text: 'Failed to block IP.' })
        setTimeout(() => setMsg(null), 3000)
      })
  }

  const unblockIp = (ip) => {
    api.delete(`/admin/blocked-ips/${encodeURIComponent(ip)}`)
      .then(() => {
        setBlockedIps(prev => prev.filter(item => item.ip !== ip))
        setMsg({ ok: true, text: `Unblocked IP ${ip}` })
        setTimeout(() => setMsg(null), 3000)
      })
      .catch(() => {
        setMsg({ ok: false, text: 'Failed to unblock IP.' })
        setTimeout(() => setMsg(null), 3000)
      })
  }

  const deleteViolation = (id) => {
    if (!confirm('Are you sure you want to delete this notification?')) return
    api.delete(`/admin/violations/${id}`)
      .then(() => {
        setViolations(prev => prev.filter(v => v.id !== id))
        setMsg({ ok: true, text: 'Notification deleted' })
        setTimeout(() => setMsg(null), 3000)
      })
      .catch(() => {
        setMsg({ ok: false, text: 'Failed to delete notification' })
        setTimeout(() => setMsg(null), 3000)
      })
  }

  const TABS = user?.role === 'TEACHER' 
    ? ['submissions', 'content-manager']
    : ['overview', 'user-monitor', 'give-xp', 'broadcast', 'submissions', 'content-manager', 'violations', 'feedbacks', 'analytics']

  // User Monitoring Calculation (calculated on backend)
  const userStats = users

  const feedbackByDate = feedbacks.reduce((groups, item) => {
    const key = getDateKey(item.createdAt)
    const group = groups.find(entry => entry.key === key)

    if (group) {
      group.items.push(item)
    } else {
      groups.push({ key, label: getDateLabel(item.createdAt), items: [item] })
    }

    return groups
  }, [])

  // Analytics Calculations
  const taskStats = tasks.map(t => {
    const taskSubs = subs.filter(s => s.taskId === t.id)
    const total = taskSubs.length
    const rejected = taskSubs.filter(s => s.status === 'Rejected').length
    const failureRate = total > 0 ? Math.round((rejected / total) * 100) : 0
    return { ...t, totalSubs: total, rejectedSubs: rejected, failureRate }
  }).sort((a, b) => b.failureRate - a.failureRate)

  // Plagiarism Detector (Basic Exact Match on Stripped Code)
  const plagiarismFlags = []
  const codeTasks = tasks.filter(t => t.type === 'CODE')
  
  codeTasks.forEach(t => {
    const taskSubs = subs.filter(s => s.taskId === t.id && s.versions?.length > 0)
    
    // Group by user, getting their latest code stripped of whitespace
    const userCodes = {}
    taskSubs.forEach(s => {
      const latestCode = s.versions[s.versions.length - 1].code
      const stripped = latestCode.replace(/\s+/g, '') // Basic normalisation
      
      // Ignore trivially short code (like empty or just default comments)
      if (stripped.length < 20) return

      if (!userCodes[stripped]) {
        userCodes[stripped] = []
      }
      if (!userCodes[stripped].find(u => u.userId === s.userId)) {
        userCodes[stripped].push({ 
          userId: s.userId, 
          userName: s.user?.name || s.user?.email || 'Unknown', 
          subId: s.id, 
          code: latestCode 
        })
      }
    })

    // Find buckets with > 1 user
    Object.values(userCodes).forEach(bucket => {
      if (bucket.length > 1) {
        plagiarismFlags.push({
          taskTitle: t.title,
          taskId: t.id,
          users: bucket,
          codeSnippet: bucket[0].code
        })
      }
    })
  })

  const pendingCount = subs.filter(s => s.status === 'Pending' || s.status === 'UnderReview').length
  const acceptedCount = subs.filter(s => s.status === 'Accepted').length

  const SIDEBAR_ITEMS = [
    { id: 'overview',     icon: '📊', label: 'Overview',       group: 'Main' },
    { id: 'user-monitor', icon: '👥', label: 'Users',          group: 'Main' },
    { id: 'give-xp',      icon: '⚡', label: 'Give XP',        group: 'Main' },
    { id: 'broadcast',    icon: '📢', label: 'Broadcast',      group: 'Main' },
    { id: 'submissions',  icon: '📝', label: 'Submissions',    group: 'Main', badge: pendingCount },
    { id: 'content-manager', icon: '📚', label: 'Content Manager', group: 'Content' },
    { id: 'violations',   icon: '🚨', label: 'Violations',     group: 'Security' },
    { id: 'feedbacks',    icon: '💬', label: 'Feedbacks',      group: 'Security' },
    { id: 'analytics',   icon: '📈', label: 'Analytics',      group: 'Security' },
  ]
  const GROUPS = ['Main', 'Content', 'Security']

  return (
    <div className="flex min-h-[calc(100vh-60px)]" style={{ background: 'var(--bg-base)' }}>

      {/* ── Left Sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        {/* Sidebar header */}
        <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-black text-xs" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>🛡️</span>
            <div>
              <p className="text-xs font-bold text-white">Admin Panel</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Management Console</p>
            </div>
          </div>
        </div>

        {/* Navigation groups */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {GROUPS.map(group => {
            const items = SIDEBAR_ITEMS.filter(i => i.group === group && TABS.includes(i.id))
            if (items.length === 0) return null
            return (
            <div key={group}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-2" style={{ color: 'var(--text-muted)' }}>{group}</p>
              <div className="space-y-0.5">
                {items.map(item => (
                  <button key={item.id} onClick={() => setTab(item.id)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      tab === item.id
                        ? 'bg-cyan-500/12 text-cyan-400'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base w-5 text-center">{item.icon}</span>
                      {item.label}
                    </div>
                    {item.badge > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )})}
        </nav>

        {/* Sidebar stats */}
        <div className="px-4 py-4 border-t space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
          {[
            { label: 'Users', value: users.length, color: 'text-cyan-400' },
            { label: 'Submissions', value: subs.length, color: 'text-white' },
            { label: 'Pending Review', value: pendingCount, color: 'text-amber-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span className={`text-[11px] font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main id="main-content" className="flex-1 overflow-auto relative">
        {/* Top bar */}
        <div className="glass-nav sticky top-0 z-20 flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-black text-white capitalize">
              {SIDEBAR_ITEMS.find(i => i.id === tab)?.icon} {SIDEBAR_ITEMS.find(i => i.id === tab)?.label || 'Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {tab === 'tasks' && (
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => setTaskLangPrompt(true)} className="btn-primary text-xs px-3.5 py-2">➕ Coding Task</button>
                <button onClick={() => { openCreateTask('C'); setTaskType('QUIZ'); }} className="btn-primary text-xs px-3.5 py-2 bg-gradient-to-r from-violet-500 to-indigo-600">➕ Quiz</button>
                <button onClick={() => { openCreateTask('C'); setTaskType('GENERAL'); }} className="btn-primary text-xs px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600">➕ General Task</button>
              </div>
            )}
            {tab === 'lessons' && (
              <button onClick={() => setLessonLangPrompt(true)} className="btn-primary text-xs px-4 py-2">➕ Create Lesson</button>
            )}
            <button onClick={fetchAllData} className="btn-ghost text-xs px-3 py-2" title="Refresh">🔄 Refresh</button>
          </div>
        </div>

        {/* Content area */}
        <div className="p-6">

        {/* Msg toast */}
        {msg && (
          <div className={`mb-4 rounded-xl px-5 py-3 text-sm font-medium animate-fade-in ${msg.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {msg.text}
          </div>
        )}

      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : tab === 'overview' ? (
        <div className="space-y-6 animate-fade-up">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users',     value: users.length,  icon: '👥', gradient: '#06b6d4, #3b82f6' },
              { label: 'Total Tasks',     value: tasks.length,  icon: '🎯', gradient: '#8b5cf6, #7c3aed' },
              { label: 'Submissions',     value: subs.length,   icon: '📝', gradient: '#10b981, #059669' },
              { label: 'Pending Review',  value: pendingCount,  icon: '⏳', gradient: '#f59e0b, #d97706' },
            ].map(({ label, value, icon, gradient }) => (
              <div key={label} className="glass-card card-hover rounded-2xl p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl mb-3"
                  style={{ background: `linear-gradient(135deg, ${gradient})` }}>{icon}</span>
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              </div>
            ))}
          </div>
          {/* Recent submissions preview */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
              <h2 className="font-bold text-white">Recent Submissions</h2>
              <button onClick={() => setTab('submissions')} className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">View all →</button>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {subs.slice(0, 6).map(s => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.task?.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.user?.name || s.user?.email}</p>
                  </div>
                  <span className={`badge ${
                    s.status === 'Accepted' ? 'badge-accepted' :
                    s.status === 'Rejected' ? 'badge-rejected' :
                    s.status === 'UnderReview' ? 'badge-review' : 'badge-pending'
                  }`}>{s.status}</span>
                  <button onClick={() => openReview(s)} className="btn-ghost text-xs px-3 py-1.5">Review</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : tab === 'user-monitor' ? (
        <div className="space-y-6">
          {userStats.length === 0 && <p className="text-slate-500 text-center py-10">No users found.</p>}
          
          {(() => {
            const admins = userStats.filter(u => u.role === 'ADMIN');
            const teachers = userStats.filter(u => u.role === 'TEACHER');
            const college = userStats.filter(u => u.role === 'STUDENT' && u.email && u.email.endsWith('@bitsathy.ac.in'));
            const external = userStats.filter(u => u.role === 'STUDENT' && !(u.email && u.email.endsWith('@bitsathy.ac.in')));

            const renderCard = (u) => (
              <div key={u.id} className="glass-card rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-base font-bold text-white shadow-md">
                    {(u.name || u.email)[0].toUpperCase()}
                  </span>
                  <div className="z-10 min-w-0 flex-1">
                    <p className="font-bold text-white text-base truncate">{u.name || 'Student'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      {u.role === 'ADMIN' && <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300">ADMIN</span>}
                      {u.role === 'TEACHER' && <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-fuchsia-500/20 text-fuchsia-300">TEACHER</span>}
                      {u.email && u.email.endsWith('@bitsathy.ac.in') ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">College Student</span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">External Student</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-1 z-10">
                  <div className="bg-white/5 rounded-lg p-2 border border-white/5" title={`Tasks: ${u.taskMarks} | XP: ${u.combinedScore - u.taskMarks}`}>
                    <p className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Total Score</p>
                    <p className="text-xl font-black text-cyan-400 leading-none">{u.combinedScore}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                    <p className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Submissions</p>
                    <p className="text-xl font-black text-white leading-none">{u.totalSubs}</p>
                  </div>
                </div>

                <div className="flex gap-1.5 z-10 text-[10px] mt-1">
                  <span className="flex-1 bg-green-500/10 text-green-400 py-1 rounded-md text-center font-bold">{u.accepted} OK</span>
                  <span className="flex-1 bg-red-500/10 text-red-400 py-1 rounded-md text-center font-bold">{u.rejected} Err</span>
                  <span className="flex-1 bg-yellow-500/10 text-yellow-400 py-1 rounded-md text-center font-bold">{u.pending} Wait</span>
                </div>
                {u.role !== 'ADMIN' && (
                  <div className="z-10 flex items-center gap-2 mt-2 border-t border-white/5 pt-2">
                    <span className="text-[9px] uppercase font-bold text-slate-500">Change Role:</span>
                    <div className="flex gap-1 flex-wrap">
                      {['STUDENT','TEACHER'].filter(r => r !== u.role).map(r => (
                        <button key={r} disabled={changingRoleId === u.id}
                          onClick={() => changeRole(u.id, r)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all disabled:opacity-50 ${
                            r === 'TEACHER' ? 'bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/40' : 'bg-slate-500/20 text-slate-300 hover:bg-slate-500/40'
                          }`}>
                          → {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );

            return (
              <div className="space-y-8">
                {admins.length > 0 && (
                  <div>
                    <h3 className="font-bold text-violet-400 mb-3 text-lg flex items-center gap-2"><span className="text-2xl">👑</span> Administrators ({admins.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{admins.map(renderCard)}</div>
                  </div>
                )}
                {teachers.length > 0 && (
                  <div>
                    <h3 className="font-bold text-fuchsia-400 mb-3 text-lg flex items-center gap-2"><span className="text-2xl">👨‍🏫</span> Teachers ({teachers.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{teachers.map(renderCard)}</div>
                  </div>
                )}
                {college.length > 0 && (
                  <div>
                    <h3 className="font-bold text-emerald-400 mb-3 text-lg flex items-center gap-2"><span className="text-2xl">🎓</span> College Students ({college.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{college.map(renderCard)}</div>
                  </div>
                )}
                {external.length > 0 && (
                  <div>
                    <h3 className="font-bold text-amber-400 mb-3 text-lg flex items-center gap-2"><span className="text-2xl">🌍</span> External Students ({external.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{external.map(renderCard)}</div>
                  </div>
                )}
              </div>
            );
          })()}
          
          {usersTotalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-4">
              <button disabled={usersPage <= 1} onClick={() => setUsersPage(p => p - 1)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              <span className="text-xs font-bold text-slate-400">Page {usersPage} of {usersTotalPages}</span>
              <button disabled={usersPage >= usersTotalPages} onClick={() => setUsersPage(p => p + 1)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          )}
        </div>
      ) : tab === 'submissions' ? (
        <div className="space-y-2">
          {subs.length === 0 && <p className="text-slate-500 text-center py-10">No submissions yet.</p>}
          {subs.map(s => (
            <div key={s.id} className="glass-card rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white truncate">{s.task?.title || 'Task'}</p>
                  {s.feedback && s.feedback.startsWith('Auto-graded') && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold ring-1 ring-emerald-500/20">🤖 Auto-graded</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-[11px] text-slate-500">{s.user?.name || s.user?.email || 'Unknown'} · {new Date(s.createdAt).toLocaleString()}</p>
                  {s.feedback && s.feedback.startsWith('Auto-graded') && (
                    <p className="text-[11px] text-emerald-400/80">{s.feedback}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {s.earnedXp > 0 && (
                  <span className="text-[11px] font-bold text-yellow-400">⚡ +{s.earnedXp} XP</span>
                )}
                {s.marks != null && (
                  <span className="text-[11px] font-bold text-white">{s.marks} pts</span>
                )}
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${STATUS_MAP[s.status] || 'bg-white/10 text-slate-400'}`}>{s.status}</span>
                <button onClick={() => openReview(s)}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    s.status === 'Accepted'
                      ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      : s.status === 'Rejected'
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
                  }`}>
                  {s.status === 'Accepted' ? '✓ Accepted' : s.status === 'Rejected' ? '✕ Rejected' : 'Review'}
                </button>
              </div>
            </div>
          ))}
          {subsTotalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-4">
              <button disabled={subsPage <= 1} onClick={() => setSubsPage(p => p - 1)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              <span className="text-xs font-bold text-slate-400">Page {subsPage} of {subsTotalPages}</span>
              <button disabled={subsPage >= subsTotalPages} onClick={() => setSubsPage(p => p + 1)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          )}
        </div>
      ) : tab === 'content-manager' ? (
        <div className="space-y-6">
          <div className="flex justify-center border-b border-white/10 pb-4">
            <div className="flex flex-wrap items-center gap-2 bg-black/40 p-1 rounded-xl">
              {courses.map(c => (
                <div key={c.id} className="relative group flex items-center">
                  <button
                    onClick={() => setContentTrack(c.title)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shrink-0 pr-16 ${
                      contentTrack === c.title ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white bg-white/5'
                    }`}
                  >
                    {c.description ? c.description + ' ' : ''}{c.title} Track
                  </button>
                  <div className="absolute right-1 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                    <button onClick={(e) => {
                      e.stopPropagation();
                      const trackName = prompt("Enter new track name:", c.title);
                      if (trackName) {
                        const emoji = prompt("Enter new emoji:", c.description || "📚");
                        api.put(`/admin/courses/${c.id}`, { title: trackName, emoji }).then(res => {
                          setCourses(courses.map(course => course.id === c.id ? res.data.course : course));
                          if (contentTrack === c.title) setContentTrack(res.data.course.title);
                          setMsg({ ok: true, text: 'Track updated!' });
                          setTimeout(() => setMsg(null), 3000);
                        }).catch(err => {
                          setMsg({ ok: false, text: 'Failed to update track' });
                          setTimeout(() => setMsg(null), 3000);
                        });
                      }
                    }} className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded bg-black/40" title="Edit Track">
                      ✏️
                    </button>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete the entire ${c.title} track? This will delete all its lessons and tasks.`)) {
                        api.delete(`/admin/courses/${c.id}`).then(() => {
                          setCourses(courses.filter(course => course.id !== c.id));
                          if (contentTrack === c.title) setContentTrack(courses.find(course => course.id !== c.id)?.title || '');
                          setMsg({ ok: true, text: 'Track deleted successfully!' });
                          setTimeout(() => setMsg(null), 3000);
                        }).catch(err => {
                          setMsg({ ok: false, text: 'Failed to delete track' });
                          setTimeout(() => setMsg(null), 3000);
                        });
                      }
                    }} className="p-1 text-red-400 hover:bg-red-500/20 rounded bg-black/40" title="Delete Track">
                      🗑
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  const track = prompt("Enter new track name:");
                  if (track && !courses.find(c => c.title === track)) {
                    const emoji = prompt("Enter an emoji for this track (e.g. 🦀):") || "📚";
                    api.post('/admin/courses', { title: track, emoji }).then(res => {
                      setCourses([...courses, res.data.course]);
                      setContentTrack(track);
                      setMsg({ ok: true, text: 'Track created!' });
                      setTimeout(() => setMsg(null), 3000);
                    }).catch(e => {
                      setMsg({ ok: false, text: e.response?.data?.error || 'Failed to create track' });
                      setTimeout(() => setMsg(null), 3000);
                    });
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10"
              >
                ➕ New Track
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Lessons Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <span className="text-xl">{courses.find(c => c.title === contentTrack)?.description || '📚'}</span> {contentTrack} Track
                </h3>
                <button onClick={() => openCreateLesson(contentTrack)}
                  className="rounded-lg bg-cyan-500/10 text-cyan-400 px-3 py-1 text-xs font-bold hover:bg-cyan-500/20 transition-colors shrink-0">
                  ➕ New Lesson
                </button>
              </div>
              <div className="space-y-2">
                {lessons.filter(l => (l.category || 'C') === contentTrack).length === 0 && <p className="text-slate-500 text-center py-4 text-sm">No lessons in {contentTrack} track yet.</p>}
                {lessons.filter(l => (l.category || 'C') === contentTrack).map(l => (
                  <div key={l.id} className="glass-card rounded-xl px-4 py-3 flex flex-col gap-2 relative group border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-white pr-16 line-clamp-1">{l.title}</p>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 absolute right-2 top-2.5 transition-all bg-black/80 pl-2 backdrop-blur-sm rounded-l">
                        <button onClick={() => openEditLesson(l)} className="p-1.5 text-cyan-400 hover:bg-cyan-500/20 rounded" title="Edit">✏️</button>
                        <button onClick={() => deleteLesson(l.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded" title="Delete">🗑️</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-semibold bg-white/5 px-2 py-0.5 rounded">Difficulty: {l.difficulty}</span>
                      <span className="text-[10px] text-slate-500 font-semibold bg-white/5 px-2 py-0.5 rounded">
                        Created: {new Date(l.createdAt).toLocaleDateString()} {new Date(l.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <span className="text-xl">🎯</span> {contentTrack} Tasks
                </h3>
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => { openCreateTask(contentTrack); setTaskType('CODE'); }}
                    className="rounded bg-cyan-500/10 text-cyan-400 px-2 py-1 text-xs font-bold hover:bg-cyan-500/20 transition-colors">
                    ➕ Code
                  </button>
                  <button onClick={() => { openCreateTask(contentTrack); setTaskType('QUIZ'); }}
                    className="rounded bg-violet-500/10 text-violet-400 px-2 py-1 text-xs font-bold hover:bg-violet-500/20 transition-colors">
                    ➕ Quiz
                  </button>
                  <button onClick={() => { openCreateTask(contentTrack); setTaskType('GENERAL'); }}
                    className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-1 text-xs font-bold hover:bg-emerald-500/20 transition-colors">
                    ➕ General
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {tasks.filter(t => (t.category || 'C') === contentTrack).length === 0 && <p className="text-slate-500 text-center py-4 text-sm">No tasks in {contentTrack} track yet.</p>}
                {tasks.filter(t => (t.category || 'C') === contentTrack).map(t => (
                  <div key={t.id} className="glass-card rounded-xl px-4 py-3 flex flex-col gap-2 relative group border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-start justify-between pr-12">
                      <p className="text-sm font-medium text-white line-clamp-1">{t.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${TYPE_MAP[t.type] || 'bg-white/5 text-slate-400'}`}>
                        {t.type || 'CODE'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold bg-white/5 px-2 py-0.5 rounded">{t.difficulty}</span>
                      {t.isDailyChallenge && <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">🔥 Daily</span>}
                      <span className="text-[10px] text-slate-500 font-semibold bg-white/5 px-2 py-0.5 rounded">
                        Created: {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 absolute right-2 top-2.5 transition-all bg-black/80 pl-2 backdrop-blur-sm rounded-l">
                      <button onClick={() => openEditTask(t)} className="p-1.5 text-cyan-400 hover:bg-cyan-500/20 rounded" title="Edit">✏️</button>
                      <button onClick={() => setDailyChallenge(t.id)} disabled={settingDailyId === t.id || t.isDailyChallenge} className="p-1.5 text-orange-400 hover:bg-orange-500/20 rounded disabled:opacity-40" title="Set Daily">🔥</button>
                      <button onClick={() => deleteTask(t.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded" title="Delete">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : tab === 'violations' ? (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-white/5">
            <h2 className="text-lg font-bold text-white">IP Blocking</h2>
            <div className="mt-4 grid md:grid-cols-[1fr_1.5fr_auto] gap-3">
              <input value={blockIp} onChange={e => setBlockIp(e.target.value)}
                className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                placeholder="IP address" />
              <input value={blockReason} onChange={e => setBlockReason(e.target.value)}
                className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                placeholder="Reason for blocking" />
              <button onClick={() => saveBlockedIp()}
                className="rounded-xl bg-red-500/10 text-red-400 px-5 py-2.5 text-sm font-bold hover:bg-red-500/20 transition-colors">
                Block IP
              </button>
            </div>
            {blockedIps.length > 0 && (
              <div className="mt-4 space-y-2">
                {blockedIps.map(item => (
                  <div key={item.id || item.ip} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-white">{item.ip}</p>
                      <p className="text-xs text-slate-500">{item.reason || 'No reason added'} · {new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                    <button onClick={() => unblockIp(item.ip)}
                      className="shrink-0 rounded-lg bg-cyan-500/10 text-cyan-400 px-3 py-1.5 text-xs font-semibold hover:bg-cyan-500/20 transition-colors">
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-3">
            {violations.length === 0 && <p className="text-slate-500 text-center py-10">No violations logged.</p>}
            {violations.map(v => {
              const detectedIp = extractIp(v.body)

              return (
                <div key={v.id} className="glass-card rounded-2xl px-6 py-4 flex items-center justify-between gap-4 border border-red-500/20 bg-red-500/5">
                  <div className="min-w-0">
                    <p className="font-bold text-white text-base">{v.title}</p>
                    <p className="text-sm text-slate-300 mt-1">{v.body}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(v.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className="bg-red-500/20 text-red-400 font-bold px-2.5 py-1 rounded-lg text-xs uppercase tracking-wider">
                      Breach
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => deleteViolation(v.id)}
                        className="rounded-lg bg-red-500/10 text-red-400 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/20 transition-colors">
                        Delete
                      </button>
                      {detectedIp && (
                        <button onClick={() => saveBlockedIp(detectedIp, v.title)}
                          className="rounded-lg bg-red-500/10 text-red-400 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/20 transition-colors">
                          Block {detectedIp}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : tab === 'feedbacks' ? (
        <div className="space-y-4">
          {feedbacks.length === 0 && <p className="text-slate-500 text-center py-10">No feedback submitted yet.</p>}
          {feedbackByDate.map(group => (
            <section key={group.key} className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-cyan-300">{group.label}</h2>
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-wider text-slate-500">{group.items.length} feedback</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.items.map(f => (
                  <div key={f.id} className="glass-card rounded-2xl p-6 border border-white/5 relative flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-white">{f.name || 'Anonymous Student'}</p>
                          <p className="text-xs text-slate-400">{f.email}</p>
                        </div>
                        <span className="text-sm">
                          {'⭐'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed font-sans">{f.message}</p>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-4 border-t border-white/5 pt-2">
                      Submitted: {new Date(f.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : tab === 'analytics' ? (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Task Difficulty & Failure Rates</h2>
            {taskStats.length === 0 && <p className="text-slate-500">No tasks available for analysis.</p>}
            <div className="space-y-3">
              {taskStats.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{t.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Total Submissions: {t.totalSubs} | Rejected: {t.rejectedSubs}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-black ${t.failureRate > 50 ? 'text-red-400' : t.failureRate > 20 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {t.failureRate}%
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Failure Rate</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Plagiarism Detector (Code Match)</h2>
            {plagiarismFlags.length === 0 && <p className="text-slate-500">No matching code snippets found across users.</p>}
            <div className="space-y-4">
              {plagiarismFlags.map((flag, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                  <p className="text-sm font-bold text-red-400 mb-2">Task: {flag.taskTitle}</p>
                  <p className="text-xs text-slate-300 mb-2">Identical code submitted by:</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {flag.users.map(u => (
                      <span key={u.userId} className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-300 border border-red-500/20">
                        {u.userName}
                      </span>
                    ))}
                  </div>
                  <details className="text-xs text-slate-400 cursor-pointer">
                    <summary className="font-semibold text-slate-300 hover:text-white transition-colors">View Matching Code</summary>
                    <pre className="mt-2 p-3 rounded-lg bg-black/40 text-slate-300 font-mono overflow-auto max-h-32">
                      {flag.codeSnippet}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : tab === 'give-xp' ? (
        <div className="max-w-2xl mx-auto mt-6">
          <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">⚡ Give XP to User</h2>
            <p className="text-sm text-slate-400 mb-6">Grant experience points to a specific user.</p>
            <form onSubmit={handleGiveXp} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">User *</label>
                <select value={giveXpUserId} onChange={e => setGiveXpUserId(e.target.value)} required
                  className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                  <option value="">Select a user</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">XP Amount *</label>
                <input type="number" value={giveXpAmount} onChange={e => setGiveXpAmount(e.target.value)} required min="1"
                  className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="e.g. 100" />
              </div>
              <button type="submit" disabled={givingXp}
                className="w-full rounded-xl bg-yellow-500/20 text-yellow-400 py-3 text-sm font-bold hover:bg-yellow-500/30 transition-colors disabled:opacity-50 mt-4">
                {givingXp ? 'Granting...' : 'Grant XP'}
              </button>
            </form>
          </div>
        </div>
      ) : tab === 'broadcast' ? (
        <div className="max-w-3xl mx-auto mt-6 space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">📢 Broadcast Notification</h2>
            <p className="text-sm text-slate-400 mb-6">Send a notification to all students.</p>
            <form onSubmit={sendBroadcast} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">Notification Title *</label>
                <input type="text" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} required
                  className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="e.g. System Maintenance" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">Message *</label>
                <textarea rows={4} value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} required
                  className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                  placeholder="Type your message here..." />
              </div>
              <button type="submit" disabled={sendingBroadcast}
                className="w-full rounded-xl bg-cyan-500/20 text-cyan-400 py-3 text-sm font-bold hover:bg-cyan-500/30 transition-colors disabled:opacity-50 mt-4">
                {sendingBroadcast ? 'Sending...' : 'Send Broadcast'}
              </button>
            </form>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">📋 Sent Broadcasts</h2>
            <p className="text-sm text-slate-400 mb-6">View and delete sent broadcast notifications.</p>

            <div className="space-y-4">
              {broadcasts.length === 0 ? (
                <p className="text-slate-500 text-center py-6 text-sm">No sent broadcasts found.</p>
              ) : (
                broadcasts.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white truncate">{b.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">{b.body}</p>
                      <span className="text-[10px] text-slate-500 block mt-2">
                        Sent on {new Date(b.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteBroadcast(b.title, b.body)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-semibold flex-shrink-0 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Review Submission Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-card rounded-3xl w-full max-w-2xl p-8 my-8 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-white text-lg">Review Submission</h2>
                  {selectedSub.feedback?.startsWith('Auto-graded') && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold ring-1 ring-emerald-500/20">🤖 Auto-graded</span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1">{selectedSub.task?.title}</p>
              </div>
              <button onClick={() => setSelectedSub(null)} className="text-slate-500 hover:text-white transition-colors text-xl">✕</button>
            </div>

            {/* Auto-grade summary */}
            {selectedSub.feedback?.startsWith('Auto-graded') && (
              <div className="mb-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="text-sm font-bold text-emerald-400">Auto-graded Result</p>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedSub.feedback}</p>
                  {selectedSub.earnedXp > 0 && (
                    <p className="text-xs text-yellow-400 mt-0.5 font-bold">⚡ +{selectedSub.earnedXp} XP awarded</p>
                  )}
                </div>
              </div>
            )}

            {/* Sample IO reference */}
            {selectedSub.task?.sampleInput && (
              <div className="mb-5 grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1.5">Expected Input</p>
                  <pre className="text-xs bg-black/40 rounded-xl p-3 overflow-auto text-slate-300 font-mono">{selectedSub.task.sampleInput}</pre>
                </div>
                {selectedSub.task?.sampleOutput && (
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1.5">Expected Output</p>
                    <pre className="text-xs bg-black/40 rounded-xl p-3 overflow-auto text-emerald-300 font-mono">{selectedSub.task.sampleOutput}</pre>
                  </div>
                )}
              </div>
            )}

            {selectedSub.versions?.length > 0 && (
              <div className="mb-5">
                <p className="text-xs text-slate-500 font-semibold mb-2">Submitted Content / Code</p>
                <pre className="text-xs bg-black/50 rounded-xl p-4 overflow-auto max-h-48 text-slate-300 font-mono">
                  {selectedSub.versions[selectedSub.versions.length - 1].code}
                </pre>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">Marks</label>
                <input type="number" value={marks} onChange={e => setMarks(e.target.value)} min={0} max={selectedSub.task?.maxMarks || 100}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  placeholder={`e.g. ${selectedSub.task?.maxMarks || 100}`} />
                {selectedSub.task?.maxMarks && (
                  <p className="text-[10px] text-slate-600 mt-1">Max marks: {selectedSub.task.maxMarks}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1.5">XP Earned (auto-calculated on save)</label>
                <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-yellow-400 font-bold">
                  ⚡ {selectedSub.earnedXp || 0} XP
                  {selectedSub.task?.baseXp > 0 && (
                    <span className="text-slate-500 text-xs font-normal ml-1">(Base: {selectedSub.task.baseXp} XP)</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs text-slate-400 font-semibold block mb-1.5">Feedback</label>
              <textarea rows={3} value={feedback} onChange={e => setFeedback(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none"
                placeholder="Write constructive feedback…" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => saveReview('Accepted')} disabled={savingSub}
                className="flex-1 rounded-xl bg-green-500/10 text-green-400 py-2.5 text-sm font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50">
                ✓ Accept
              </button>
              <button onClick={() => saveReview('Rejected')} disabled={savingSub}
                className="flex-1 rounded-xl bg-red-500/10 text-red-400 py-2.5 text-sm font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50">
                ✗ Reject
              </button>
              <button onClick={() => saveReview('UnderReview')} disabled={savingSub}
                className="flex-1 rounded-xl bg-blue-500/10 text-blue-400 py-2.5 text-sm font-semibold hover:bg-blue-500/20 transition-colors disabled:opacity-50">
                🔍 Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language Picker — Task */}
      {taskLangPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-fade-up">
            <h2 className="font-black text-white text-xl mb-1">➕ Create New Task</h2>
            <p className="text-sm text-slate-400 mb-8">Choose the programming language for this task</p>
            <div className="grid grid-cols-2 gap-4">
              {courses.map(c => (
                <button
                  key={c.id}
                  onClick={() => openCreateTask(c.title)}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-500 transition-all group"
                >
                  <span className="text-4xl">{c.description || '🖥️'}</span>
                  <span className="font-black text-white text-lg group-hover:text-cyan-400 transition-colors">{c.title}</span>
                  <span className="text-xs text-slate-400">{c.title} Track</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setTaskLangPrompt(false)}
              className="mt-6 w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Language Picker — Lesson */}
      {lessonLangPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-fade-up">
            <h2 className="font-black text-white text-xl mb-1">📚 Create New Lesson</h2>
            <p className="text-sm text-slate-400 mb-8">Choose the programming language for this lesson</p>
            <div className="grid grid-cols-2 gap-4">
              {courses.map(c => (
                <button
                  key={c.id}
                  onClick={() => openCreateLesson(c.title)}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-500 transition-all group"
                >
                  <span className="text-4xl">{c.description || '📚'}</span>
                  <span className="font-black text-white text-lg group-hover:text-cyan-400 transition-colors">{c.title}</span>
                  <span className="text-xs text-slate-400">{c.title} Track</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setLessonLangPrompt(false)}
              className="mt-6 w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task Creation & Edit Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-card rounded-3xl w-full max-w-2xl p-8 my-8 shadow-2xl relative">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-bold text-white text-xl">{editingTask ? '✏️ Edit Task' : '➕ Create New Task'}</h2>
                <p className="text-xs text-slate-400 mt-1">Configure your task, questions, and grading rules</p>
              </div>
              <button onClick={() => setTaskModalOpen(false)} className="text-slate-500 hover:text-white transition-colors text-xl">✕</button>
            </div>

            <form onSubmit={saveTask} className="space-y-6">
              
              {/* SECTION 1: General Info */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <span>1</span> General Information
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">Task Title *</label>
                    <input type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required
                      className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow" placeholder="e.g. List Comprehension Basics" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">Task Type</label>
                    <select value={taskType} onChange={e => setTaskType(e.target.value)}
                      className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow">
                      <option value="GENERAL">General </option>
                      <option value="CODE">Code </option>
                      <option value="QUIZ">One-Mark Quiz </option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-5">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">Difficulty</label>
                    <select value={taskDiff} onChange={e => setTaskDiff(e.target.value)}
                      className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow">
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">Language Track</label>
                    <select value={taskCategory} onChange={e => setTaskCategory(e.target.value)}
                      className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow">
                      {courses.map(c => <option key={c.id} value={c.title}>{c.title} Track</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">Course (Optional)</label>
                    <select value={taskCourseId} onChange={e => setTaskCourseId(e.target.value)}
                      className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow">
                      <option value="">No Course (Global)</option>
                      {(() => {
                        const uniqueOptions = [];
                        const seen = new Set();
                        courses.forEach(c => {
                          let title = (c.title || '').trim();
                          if (title.toLowerCase() === 'main course') title = 'Python';
                          const normTitle = (title.toLowerCase() === 'c' || title.toLowerCase() === 'c track' || title.toLowerCase() === 'c language') ? 'C' : 
                                            (title.toLowerCase() === 'python' || title.toLowerCase() === 'python track' || title.toLowerCase() === 'python language') ? 'Python' : null;
                          if (normTitle && !seen.has(normTitle)) {
                            seen.add(normTitle);
                            uniqueOptions.push(<option key={c.id} value={c.id}>{normTitle}</option>);
                          }
                        });
                        return uniqueOptions;
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">Due Date (Optional)</label>
                    <input type="date" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)}
                      className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-5">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">Base XP <span className="text-amber-500">⚡</span></label>
                    <input type="number" value={taskBaseXp} onChange={e => setTaskBaseXp(e.target.value)} required
                      className="w-full rounded-xl bg-black/20 border border-amber-500/20 px-4 py-2.5 text-sm text-amber-400 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-shadow" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">Target Time (secs)</label>
                    <input type="number" value={taskTargetTime} onChange={e => setTaskTargetTime(e.target.value)} placeholder="e.g. 600"
                      className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">Max Marks</label>
                    <input type="number" value={taskMaxMarks} onChange={e => setTaskMaxMarks(e.target.value)} placeholder="e.g. 100"
                      className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow" />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Description & Guidance */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <span>2</span> Task Content
                </h3>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1.5">Task Description *</label>
                  <textarea rows={3} value={taskDesc} onChange={e => setTaskDesc(e.target.value)} required
                    className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none transition-shadow"
                    placeholder="Explain the rules and requirements for this task..." />
                </div>

                {taskType !== 'QUIZ' && (
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">Hints / Guidance</label>
                    <textarea rows={2} value={taskHints} onChange={e => setTaskHints(e.target.value)}
                      className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none transition-shadow"
                      placeholder="Provide optional hints or guidance for students..." />
                  </div>
                )}
              </div>

              {/* SECTION 3: Task-Specific Settings */}
              {taskType === 'CODE' && (
                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                  <h3 className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <span>3</span> Compiler Configuration
                  </h3>
                  
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">Starter Code</label>
                    <textarea rows={3} value={taskStarterCode} onChange={e => setTaskStarterCode(e.target.value)}
                      className="w-full rounded-xl bg-black/40 border border-cyan-500/20 px-4 py-3 text-sm text-cyan-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow"
                      placeholder="# Write starter python code here..." />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs text-slate-400 font-semibold block mb-1.5">Sample Input</label>
                      <textarea rows={2} value={taskSampleInput} onChange={e => setTaskSampleInput(e.target.value)}
                        className="w-full rounded-xl bg-black/40 border border-cyan-500/20 px-4 py-2 text-sm text-cyan-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow"
                        placeholder="Sample input data..." />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-semibold block mb-1.5">Sample Output</label>
                      <textarea rows={2} value={taskSampleOutput} onChange={e => setTaskSampleOutput(e.target.value)}
                        className="w-full rounded-xl bg-black/40 border border-cyan-500/20 px-4 py-2 text-sm text-cyan-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow"
                        placeholder="Expected sample output..." />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-slate-400 font-semibold">Hidden Test Cases (for auto-grading)</label>
                      <button type="button" onClick={addTestCase}
                        className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] text-cyan-300 hover:bg-cyan-500/20 transition-all font-bold">
                        ➕ Add Test Case
                      </button>
                    </div>
                    {taskTestCases.length === 0 && (
                      <p className="text-[10px] text-slate-500 italic px-2 py-1 bg-black/20 rounded">No hidden test cases. Click "Add Test Case" to include input/output pairs.</p>
                    )}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {taskTestCases.map((tc, i) => (
                        <div key={i} className="flex gap-2 items-start bg-black/20 p-2 rounded-lg border border-cyan-500/10">
                          <input type="text" value={tc.input} onChange={e => handleTestCaseChange(i, 'input', e.target.value)} placeholder="Input" className="flex-1 rounded-lg bg-black/40 border border-cyan-500/20 px-3 py-1.5 text-xs text-cyan-100 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/50" />
                          <input type="text" value={tc.output} onChange={e => handleTestCaseChange(i, 'output', e.target.value)} placeholder="Output" className="flex-1 rounded-lg bg-black/40 border border-cyan-500/20 px-3 py-1.5 text-xs text-cyan-100 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/50" />
                          <button type="button" onClick={() => removeTestCase(i)} className="text-red-400 hover:text-red-300 hover:bg-red-500/20 text-xs px-2 py-1.5 rounded bg-red-500/10 transition-colors">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {taskType === 'QUIZ' && (
                <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex items-center justify-between relative z-10">
                    <h3 className="text-[11px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-2">
                      <span>3</span> Quiz Questions
                    </h3>
                    <button type="button" onClick={addQuizQuestion}
                      className="rounded-xl border border-violet-500/30 bg-violet-500/20 px-4 py-2 text-xs text-violet-300 hover:bg-violet-500/30 hover:text-violet-100 font-bold transition-all shadow-lg">
                      ➕ Add Question
                    </button>
                  </div>

                  {quizQuestions.length === 0 && (
                    <div className="text-center py-8 bg-black/20 rounded-xl border border-dashed border-violet-500/30 relative z-10">
                      <span className="text-3xl block mb-2">📝</span>
                      <p className="text-sm font-semibold text-violet-300">No questions added yet</p>
                      <p className="text-xs text-slate-400 mt-1">Click "Add Question" to start building your quiz.</p>
                    </div>
                  )}

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 relative z-10">
                    {quizQuestions.map((q, idx) => (
                      <div key={idx} className="bg-black/30 border border-violet-500/20 rounded-2xl p-5 space-y-4 relative group hover:border-violet-500/40 transition-colors">
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                          <span className="text-sm font-black text-violet-400">Question {idx + 1}</span>
                          <button type="button" onClick={() => removeQuizQuestion(idx)}
                            className="text-xs text-red-400 hover:text-red-300 hover:underline font-semibold bg-red-500/10 px-3 py-1 rounded-lg transition-colors">
                            🗑️ Remove
                          </button>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">Question Text *</label>
                          <input type="text" value={q.question} onChange={e => handleQuestionChange(idx, 'question', e.target.value)} required
                            className="w-full rounded-xl bg-white/5 border border-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-shadow" placeholder="What does 10 // 3 evaluate to in Python?" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx}>
                              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">Option {String.fromCharCode(65 + oIdx)} *</label>
                              <input type="text" value={opt} onChange={e => handleOptionChange(idx, oIdx, e.target.value)} required
                                className="w-full rounded-xl bg-white/5 border border-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-shadow" placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} />
                            </div>
                          ))}
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">Correct Option Value *</label>
                          <select value={q.answer} onChange={e => handleQuestionChange(idx, 'answer', e.target.value)} required
                            className="w-full rounded-xl bg-violet-900/30 border border-violet-500/30 px-4 py-2.5 text-sm text-violet-200 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-shadow appearance-none cursor-pointer">
                            <option value="">-- Choose Correct Option --</option>
                            {q.options.map((opt, oIdx) => (
                              opt.trim() !== '' && <option key={oIdx} value={opt}>{opt} ({String.fromCharCode(65 + oIdx)})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 border-t border-white/5 pt-5">
                <button type="submit" disabled={savingTask}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-sm font-bold text-white shadow-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                  {savingTask ? '⏳ Saving...' : '💾 Save Task'}
                </button>
                <button type="button" onClick={() => setTaskModalOpen(false)}
                  className="rounded-xl border border-white/10 px-6 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Creation Modal */}
      {lessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-card rounded-3xl w-full max-w-2xl p-8 my-8 shadow-2xl relative">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-bold text-white text-xl">📚 Create New Lesson</h2>
                <p className="text-xs text-slate-400 mt-1">Build a lesson with text content and/or an embedded video</p>
              </div>
              <button onClick={() => setLessonModalOpen(false)} className="text-slate-500 hover:text-white transition-colors text-xl">✕</button>
            </div>

            <form onSubmit={saveLesson} className="space-y-5">
              {/* SECTION 1: Basics */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">1 · Basics</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">Lesson Title *</label>
                    <input type="text" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} required
                      className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow" placeholder="e.g. Introduction to Variables" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">Difficulty</label>
                    <select value={lessonDifficulty} onChange={e => setLessonDifficulty(e.target.value)}
                      className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow">
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1.5">Language Track</label>
                    <select value={lessonCategory} onChange={e => setLessonCategory(e.target.value)}
                      className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow">
                      {courses.map(c => <option key={c.id} value={c.title}>{c.title} Track</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Video URL */}
              <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5 space-y-3">
                <h3 className="text-[11px] font-bold text-violet-400 uppercase tracking-widest">2 · Video (Optional)</h3>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1.5">YouTube / Video URL</label>
                  <input type="url" value={lessonVideoUrl} onChange={e => setLessonVideoUrl(e.target.value)}
                    className="w-full rounded-xl bg-black/20 border border-violet-500/20 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-shadow"
                    placeholder="https://www.youtube.com/watch?v=..." />
                  {lessonVideoUrl && (
                    <p className="text-[10px] mt-1.5 font-semibold">
                      {/youtube\.com|youtu\.be/.test(lessonVideoUrl)
                        ? <span className="text-green-400">✅ YouTube URL detected — will be embedded as a video player</span>
                        : <span className="text-slate-400">🔗 URL saved — will be shown as a link</span>
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* SECTION 3: Content */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">3 · Content</h3>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1.5">Lesson Content *</label>
                  <textarea rows={6} value={lessonContent} onChange={e => setLessonContent(e.target.value)} required
                    className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none transition-shadow"
                    placeholder="Write the main lesson text here — theory, examples, step-by-step explanations..." />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1.5">Additional Notes (Optional)</label>
                  <textarea rows={2} value={lessonNotes} onChange={e => setLessonNotes(e.target.value)}
                    className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none transition-shadow"
                    placeholder="Extra study tips, references, or key takeaways..." />
                </div>
              </div>

              <div className="flex gap-3 border-t border-white/5 pt-5">
                <button type="submit" disabled={savingLesson}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-sm font-bold text-white shadow-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                  {savingLesson ? '⏳ Saving...' : '💾 Save Lesson'}
                </button>
                <button type="button" onClick={() => setLessonModalOpen(false)}
                  className="rounded-xl border border-white/10 px-6 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>{/* end content area p-6 */}
      </main>{/* end main content flex-1 */}
    </div>
  )
}
