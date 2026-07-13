"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();

async function notifyStudents(title, body) {
    const users = await prisma_1.prisma.user.findMany();
    await Promise.all(users.map(user => {
        return prisma_1.prisma.notification.create({
            data: {
                userId: user.id,
                title,
                body,
                kind: 'NEW_TASK'
            }
        });
    }));
}

function validatePythonCode(code) {
    const cleanCode = code.replace(/\s+/g, ' ');
    const forbiddenModules = ['os', 'sys', 'subprocess', 'socket', 'shutil', 'platform', 'importlib', 'ctypes', 'builtins'];
    for (const mod of forbiddenModules) {
        const importRegex = new RegExp(`\\b(import|from)\\s+${mod}\\b`);
        if (importRegex.test(cleanCode)) {
            return { valid: false, reason: `Importing the module "${mod}" is forbidden for security reasons.` };
        }
    }
    const forbiddenBuiltins = ['eval', 'exec', 'open', '__import__', 'getattr', 'globals', 'locals'];
    for (const func of forbiddenBuiltins) {
        const funcRegex = new RegExp(`\\b${func}\\s*\\(`);
        if (funcRegex.test(cleanCode)) {
            return { valid: false, reason: `Calling "${func}()" is forbidden for security reasons.` };
        }
    }
    return { valid: true };
}

function validateCCode(code) {
    const cleanCode = code.replace(/\s+/g, ' ');
    const forbiddenHeaders = ['unistd.h', 'dirent.h', 'sys/', 'fcntl.h', 'process.h'];
    for (const header of forbiddenHeaders) {
        const headerRegex = new RegExp(`#\\s*include\\s*[<\\"]${header}[>\\"]`);
        if (headerRegex.test(code)) {
            return { valid: false, reason: `Including header "${header}" is forbidden for security reasons.` };
        }
    }
    const forbiddenCalls = ['system', 'popen', 'fork', 'exec', 'remove', 'rename', 'fopen', 'freopen', 'mkdir', 'rmdir'];
    for (const call of forbiddenCalls) {
        const callRegex = new RegExp(`\\b${call}\\s*\\(`);
        if (callRegex.test(cleanCode)) {
            return { valid: false, reason: `Calling "${call}()" is forbidden for security reasons.` };
        }
    }
    return { valid: true };
}

router.get('/', async (_req, res) => {
    const tasks = await prisma_1.prisma.task.findMany({
        where: { published: true },
        select: {
            id: true, title: true, type: true, difficulty: true,
            baseXp: true, deadline: true, targetTime: true, maxMarks: true,
            published: true, isDraft: true, courseId: true,
            createdAt: true, updatedAt: true
        },
        orderBy: { deadline: 'asc' }
    });
    res.json({ tasks });
});

// IMPORTANT: /run-code must be declared before any /:id routes
// to prevent Express matching "run-code" as an :id param
router.post('/run-code', async (req, res) => {
    const child_process = require('child_process');
    const fs = require('fs');
    const path = require('path');
    const { code, language, input } = req.body;
    if (!code || !language) {
        return res.status(400).json({ error: 'Missing code or language' });
    }
    if (language === 'python') {
        const validation = validatePythonCode(code);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.reason });
        }
    } else if (language === 'c') {
        const validation = validateCCode(code);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.reason });
        }
    } else {
        return res.status(400).json({ error: 'Unsupported language' });
    }
    const tempDir = path.join(__dirname, '../../temp_run');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const fileId = Math.random().toString(36).substring(7);
    if (language === 'python') {
        const filePath = path.join(tempDir, `run_${fileId}.py`);
        fs.writeFileSync(filePath, code);
        const antigravityPath = path.join(tempDir, 'antigravity.py');
        if (!fs.existsSync(antigravityPath)) {
            fs.writeFileSync(antigravityPath, 'print("🚀 You are now floating in the air! (antigravity module loaded)")\n');
        }

        let pythonCmd = 'python3';
        try {
            const out = child_process.spawnSync('python3', ['--version']);
            if (out.error || out.status !== 0) pythonCmd = 'python';
        } catch (e) { pythonCmd = 'python'; }

        const child = child_process.spawn(pythonCmd, [filePath]);
        let stdout = '';
        let stderr = '';
        if (input) {
            child.stdin.write(input);
            child.stdin.end();
        }
        child.stdout.on('data', (data) => { stdout += data.toString(); });
        child.stderr.on('data', (data) => { stderr += data.toString(); });
        const timeout = setTimeout(() => { child.kill(); }, 5000);
        child.on('close', (exitCode) => {
            clearTimeout(timeout);
            try { fs.unlinkSync(filePath); } catch (e) {}
            res.json({ stdout, stderr, exitCode });
        });
        child.on('error', (err) => {
            clearTimeout(timeout);
            try { fs.unlinkSync(filePath); } catch (e) {}
            res.json({ stdout, stderr, exitCode: 1, error: err.message });
        });
    } else if (language === 'c') {
        const sourcePath = path.join(tempDir, `run_${fileId}.c`);
        const isWin = process.platform === 'win32';
        const exePath = path.join(tempDir, isWin ? `run_${fileId}.exe` : `run_${fileId}`);
        fs.writeFileSync(sourcePath, code);
        // Prefer gcc then clang
        const compilers = ['gcc', 'clang'];
        let compiled = false;
        let compileErrMsg = '';
        for (const compiler of compilers) {
            try {
                child_process.execSync(`${compiler} "${sourcePath}" -o "${exePath}"`, { stdio: 'pipe', timeout: 10000 });
                compiled = true;
                break;
            } catch (ce) {
                compileErrMsg = (ce && ce.stderr) ? ce.stderr.toString() : (ce && ce.message) ? ce.message : String(ce);
                // If it was a real compile error and not a missing command, don't try the next compiler
                if (ce.status !== undefined && compileErrMsg.trim() && !compileErrMsg.includes('not recognized') && !compileErrMsg.includes('not found')) {
                    break;
                }
            }
        }
        if (!compiled) {
            try { fs.unlinkSync(sourcePath); } catch (e) {}
            return res.json({ stdout: '', stderr: compileErrMsg || 'Compilation failed (no compiler available)', exitCode: 1, compileError: true });
        }
        try {
            if (!isWin) {
                // ensure executable bit
                fs.chmodSync(exePath, 0o755);
            }
        } catch (e) {}
        const child = child_process.spawn(exePath);
            let stdout = '';
            let stderr = '';
            if (input) {
                child.stdin.write(input);
                child.stdin.end();
            }
            child.stdout.on('data', (data) => { stdout += data.toString(); });
            child.stderr.on('data', (data) => { stderr += data.toString(); });
            const timeout = setTimeout(() => { child.kill(); }, 5000);
            child.on('close', (exitCode) => {
                clearTimeout(timeout);
                try { fs.unlinkSync(sourcePath); } catch (e) {}
                try { fs.unlinkSync(exePath); } catch (e) {}
                res.json({ stdout, stderr, exitCode });
            });
            child.on('error', (err) => {
                clearTimeout(timeout);
                try { fs.unlinkSync(sourcePath); } catch (e) {}
                try { fs.unlinkSync(exePath); } catch (e) {}
                res.json({ stdout, stderr, exitCode: 1, error: err.message });
            });
    }
});

router.get('/admin', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN', 'TEACHER'), async (_req, res) => {
    const tasks = await prisma_1.prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ tasks });
});

router.get('/:id', async (req, res) => {
    const task = await prisma_1.prisma.task.findUnique({
        where: { id: String(req.params.id) },
        include: {
            quizQuestions: {
                select: {
                    id: true,
                    question: true,
                    options: true,
                    order: true
                },
                orderBy: { order: 'asc' }
            }
        }
    });
    if (!task)
        return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
});

router.get('/admin/:id', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN', 'TEACHER'), async (req, res) => {
    const task = await prisma_1.prisma.task.findUnique({
        where: { id: String(req.params.id) },
        include: {
            quizQuestions: {
                orderBy: { order: 'asc' }
            }
        }
    });
    if (!task)
        return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
});

router.post('/', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN', 'TEACHER'), (0, validation_1.validateBody)(validation_1.createTaskSchema), async (req, res) => {
    const { title, description, courseId, category, type, difficulty, deadline, testCases, sampleInput, sampleOutput, hints, starterCode, isDraft, quizQuestions, baseXp, targetTime, maxMarks } = req.body;
    
    const taskCategory = category || 'C';
    let resolvedCourseId = courseId || null;
    if (!resolvedCourseId) {
        let course = await prisma_1.prisma.course.findFirst({ where: { title: taskCategory } });
        if (!course) {
            course = await prisma_1.prisma.course.create({ data: { title: taskCategory } });
        }
        resolvedCourseId = course.id;
    }

    const task = await prisma_1.prisma.task.create({
        data: {
            title,
            description,
            courseId: resolvedCourseId,
            category: taskCategory,
            type: type || 'CODE',
            difficulty: difficulty || 'Beginner',
            deadline: deadline ? new Date(deadline) : null,
            baseXp: Number(baseXp) || 0,
            targetTime: targetTime ? Number(targetTime) : null,
            maxMarks: maxMarks ? Number(maxMarks) : null,
            testCases: testCases || '',
            sampleInput: sampleInput || '',
            sampleOutput: sampleOutput || '',
            hints: hints || '',
            starterCode: starterCode || '',
            isDraft: Boolean(isDraft),
            published: !Boolean(isDraft),
            quizQuestions: type === 'QUIZ' && Array.isArray(quizQuestions) ? {
                create: quizQuestions.map((q, idx) => ({
                    question: q.question,
                    options: JSON.stringify(q.options),
                    answer: q.answer,
                    order: q.order ?? idx
                }))
            } : undefined
        },
        include: { quizQuestions: true }
    });
    
    if (task.published) {
        await notifyStudents('New Task Available!', `A new task "${task.title}" has been published.`);
    }
    
    res.status(201).json({ task });
});

router.put('/:id', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN', 'TEACHER'), (0, validation_1.validateBody)(validation_1.updateTaskSchema), async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const taskData = {
        title: updates.title,
        description: updates.description,
        courseId: updates.courseId !== undefined ? updates.courseId : undefined,
        category: updates.category !== undefined ? updates.category : undefined,
        type: updates.type,
        difficulty: updates.difficulty,
        deadline: updates.deadline ? new Date(updates.deadline) : undefined,
        sampleInput: updates.sampleInput,
        sampleOutput: updates.sampleOutput,
        hints: updates.hints,
        starterCode: updates.starterCode,
        testCases: updates.testCases,
        baseXp: updates.baseXp !== undefined ? Number(updates.baseXp) : undefined,
        targetTime: updates.targetTime !== undefined ? Number(updates.targetTime) : undefined,
        maxMarks: updates.maxMarks !== undefined ? Number(updates.maxMarks) : undefined,
        published: typeof updates.published === 'boolean' ? updates.published : undefined,
        isDraft: typeof updates.isDraft === 'boolean' ? updates.isDraft : undefined
    };
    if (updates.type === 'QUIZ' && Array.isArray(updates.quizQuestions)) {
        await prisma_1.prisma.quizQuestion.deleteMany({ where: { taskId: id } });
        taskData.quizQuestions = {
            create: updates.quizQuestions.map((q, idx) => ({
                question: q.question,
                options: JSON.stringify(q.options),
                answer: q.answer,
                order: q.order ?? idx
            }))
        };
    }
    const task = await prisma_1.prisma.task.update({
        where: { id },
        data: taskData,
        include: { quizQuestions: true }
    });
    res.json({ task });
});

router.delete('/:id', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN', 'TEACHER'), async (req, res) => {
    const { id } = req.params;
    const task = await prisma_1.prisma.task.findUnique({ where: { id } });
    if (task) {
        await prisma_1.prisma.notification.deleteMany({
            where: { body: { contains: task.title } }
        });
    }
    await prisma_1.prisma.task.delete({ where: { id } });
    res.json({ ok: true });
});

router.post('/:id/publish', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN', 'TEACHER'), async (req, res) => {
    const { id } = req.params;
    const task = await prisma_1.prisma.task.update({ where: { id }, data: { published: true, isDraft: false } });
    await notifyStudents('New Task Available!', `A new task "${task.title}" has been published.`);
    res.json({ task });
});

// Daily Challenge: set a task as today's challenge
router.patch('/:id/daily', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const { id } = req.params;
        // Unset all existing daily challenges first
        await prisma_1.prisma.task.updateMany({ where: { isDailyChallenge: true }, data: { isDailyChallenge: false } });
        const task = await prisma_1.prisma.task.update({ where: { id }, data: { isDailyChallenge: true } });
        await notifyStudents('🔥 Daily Challenge!', `Today's challenge is: "${task.title}". Can you beat it?`);
        res.json({ task });
    } catch (e) {
        res.status(500).json({ error: 'Failed to set daily challenge' });
    }
});

// Daily Challenge: get today's challenge (public)
router.get('/challenge/daily', async (_req, res) => {
    try {
        const task = await prisma_1.prisma.task.findFirst({
            where: { isDailyChallenge: true, published: true }
        });
        res.json({ task: task || null });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch daily challenge' });
    }
});


router.post('/:id/submit', auth_1.authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.sub;
    const { code, timeTaken, language } = req.body;
    if (!userId)
        return res.status(401).json({ error: 'Authentication required' });
    const task = await prisma_1.prisma.task.findUnique({
        where: { id },
        include: { quizQuestions: true }
    });
    if (!task)
        return res.status(404).json({ error: 'Task not found' });
    let status = 'Pending';
    let marks = null;
    let feedback = null;
    let earnedXp = 0;
    if (task.type === 'QUIZ') {
        let parsedAnswers = [];
        try {
            parsedAnswers = JSON.parse(code);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid answers format. Must be JSON.' });
        }
        let correctCount = 0;
        const totalQuestions = task.quizQuestions.length;
        task.quizQuestions.forEach(q => {
            const studentAns = parsedAnswers.find(a => a.questionId === q.id)?.answer || '';
            if (q.answer.trim().toLowerCase() === studentAns.trim().toLowerCase()) {
                correctCount++;
            }
        });
        marks = correctCount;
        status = 'Accepted';
        feedback = `Auto-graded: ${correctCount}/${totalQuestions} correct answers.`;
        
        let max = task.maxMarks || totalQuestions;
        if (max > 0 && marks > 0) {
            let pct = marks / max;
            earnedXp = Math.floor(pct * (task.baseXp || 0));
        }
        
        if (earnedXp > 0) {
            await prisma_1.prisma.leaderboard.upsert({
                where: { userId },
                update: { xp: { increment: earnedXp } },
                create: { userId, xp: earnedXp }
            });
        }
    } else if (task.type === 'CODE' && language && task.sampleInput && task.sampleOutput) {
        if (language === 'python') {
            const validation = validatePythonCode(code);
            if (!validation.valid) {
                return res.status(400).json({ error: validation.reason });
            }
        } else if (language === 'c') {
            const validation = validateCCode(code);
            if (!validation.valid) {
                return res.status(400).json({ error: validation.reason });
            }
        }
        const child_process = require('child_process');
        const fs = require('fs');
        const path = require('path');
        const tempDir = path.join(__dirname, '../../temp_run');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const fileId = Math.random().toString(36).substring(7);
        let runStdout = '';
        if (language === 'python') {
            const filePath = path.join(tempDir, `run_${fileId}.py`);
            fs.writeFileSync(filePath, code);
            const antigravityPath = path.join(tempDir, 'antigravity.py');
            if (!fs.existsSync(antigravityPath)) {
                fs.writeFileSync(antigravityPath, 'print("🚀 You are now floating in the air! (antigravity module loaded)")\n');
            }

            let pythonCmd = 'python3';
            try {
                const out = child_process.spawnSync('python3', ['--version']);
                if (out.error || out.status !== 0) pythonCmd = 'python';
            } catch (e) { pythonCmd = 'python'; }

            try {
                const out = child_process.spawnSync(pythonCmd, [filePath], { input: task.sampleInput, timeout: 5000 });
                if (out && out.status !== null) {
                    runStdout = out.stdout ? out.stdout.toString() : '';
                }
            } catch (e) {}
            try { fs.unlinkSync(filePath); } catch (e) {}
        } else if (language === 'c') {
            const sourcePath = path.join(tempDir, `run_${fileId}.c`);
            const isWin = process.platform === 'win32';
            const exePath = path.join(tempDir, isWin ? `run_${fileId}.exe` : `run_${fileId}`);
            fs.writeFileSync(sourcePath, code);
            // Prefer gcc then clang
            const compilers = ['gcc', 'clang'];
            let compiled = false;
            for (const compiler of compilers) {
                try {
                    child_process.execSync(`${compiler} "${sourcePath}" -o "${exePath}"`, { stdio: 'pipe', timeout: 5000 });
                    compiled = true;
                    break;
                } catch (ce) {
                    const errMsg = (ce && ce.stderr) ? ce.stderr.toString() : (ce && ce.message) ? ce.message : String(ce);
                    if (ce.status !== undefined && errMsg.trim() && !errMsg.includes('not recognized') && !errMsg.includes('not found')) {
                        break; // syntax error, don't try fallback
                    }
                }
            }
            if (compiled) {
                try {
                    if (!isWin) fs.chmodSync(exePath, 0o755);
                    const out = child_process.spawnSync(exePath, { input: task.sampleInput, timeout: 5000 });
                    runStdout = out.stdout ? out.stdout.toString() : '';
                } catch (e) {
                    // ignore runtime errors here
                }
            }
            try { fs.unlinkSync(sourcePath); } catch (e) {}
            try { fs.unlinkSync(exePath); } catch (e) {}
        }

        if (runStdout.trim() === task.sampleOutput.trim()) {
            marks = task.maxMarks || 10;
            status = 'Accepted';
            feedback = 'Auto-graded: Output matches expected sample output.';
        earnedXp = task.baseXp || 0;
            
            if (earnedXp > 0) {
                await prisma_1.prisma.leaderboard.upsert({
                    where: { userId },
                    update: { xp: { increment: earnedXp } },
                    create: { userId, xp: earnedXp }
                });
            }
        }
    }
    const existingSubmission = await prisma_1.prisma.submission.findUnique({
        where: {
            taskId_userId: {
                taskId: id,
                userId: userId
            }
        }
    });
    let submission;
    if (existingSubmission) {
        submission = await prisma_1.prisma.submission.update({
            where: { id: existingSubmission.id },
            data: {
                status,
                marks,
                feedback,
                timeTaken: timeTaken ? Number(timeTaken) : null,
                earnedXp,
                versions: {
                    create: [{ code, isFinal: true }]
                }
            },
            include: { versions: true }
        });
    } else {
        submission = await prisma_1.prisma.submission.create({
            data: {
                taskId: id,
                userId,
                status,
                marks,
                feedback,
                timeTaken: timeTaken ? Number(timeTaken) : null,
                earnedXp,
                versions: {
                    create: [{ code, isFinal: true }]
                }
            },
            include: { versions: true }
        });
    }
    let responseMsg;
    if (task.type === 'QUIZ') {
        responseMsg = `Quiz graded! You got ${marks}/${task.quizQuestions.length} correct.`;
    } else if (task.type === 'CODE' && status === 'Accepted') {
        responseMsg = `✅ Output matches! Auto-graded: ${marks} marks, ⚡ +${earnedXp} XP earned.`;
    } else {
        responseMsg = 'Solution submitted successfully! Awaiting manual review.';
    }
    res.status(201).json({
        message: responseMsg,
        submission
    });
});

// /run-code route moved above /:id routes (see above)

router.post('/:id/violation', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user?.sub;
        if (!userId)
            return res.status(401).json({ error: 'Authentication required' });
        const task = await prisma_1.prisma.task.findUnique({ where: { id } });
        if (!task)
            return res.status(404).json({ error: 'Task not found' });
        const student = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        const studentName = student ? (student.name || student.email) : 'Unknown Student';
        
        await prisma_1.prisma.activityLog.create({
            data: {
                userId,
                action: 'TASK_VIOLATION',
                meta: JSON.stringify({ taskId: id, taskTitle: task.title, reason })
            }
        });

        // Auto-reject so it's hidden
        const existingSub = await prisma_1.prisma.submission.findUnique({
            where: { taskId_userId: { taskId: id, userId } }
        });
        if (!existingSub) {
            await prisma_1.prisma.submission.create({
                data: {
                    taskId: id,
                    userId,
                    status: 'Rejected',
                    feedback: `Auto-rejected due to lock-down violation: ${reason}`,
                    versions: { create: [{ code: `// VIOLATION: ${reason}`, isFinal: true }] }
                }
            });
        }

        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'Unknown IP';
        
        const recentViolations = await prisma_1.prisma.activityLog.count({
            where: {
                userId,
                action: 'TASK_VIOLATION',
                createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
            }
        });

        let autoBlocked = false;
        // recentViolations includes the one we just inserted!
        if (recentViolations >= 3 && ipAddress && ipAddress !== 'Unknown IP') {
            await prisma_1.prisma.blockedIp.upsert({
                where: { ip: String(ipAddress) },
                update: {},
                create: {
                    ip: String(ipAddress),
                    reason: 'Auto-blocked due to 3+ cheating violations within 5 minutes.',
                    blockedBy: 'SYSTEM'
                }
            });
            if (global.blockedIpsCache) {
                global.blockedIpsCache.add(String(ipAddress));
            }
            autoBlocked = true;
        }

        const admins = await prisma_1.prisma.user.findMany({ where: { role: 'ADMIN' } });
        await Promise.all(admins.map(admin => {
            return prisma_1.prisma.notification.create({
                data: {
                    userId: admin.id,
                    title: autoBlocked ? '🛑 Auto-Block: Cheat Alert' : '🚨 Cheat Alert: Task Violation',
                    body: autoBlocked 
                        ? `Student "${studentName}" (ID: ${userId}, IP: ${ipAddress}) was AUTO-BLOCKED for triggering 3+ violations. Latest reason: ${reason || 'Unknown'}`
                        : `Student "${studentName}" (ID: ${userId}, IP: ${ipAddress}) triggered a lock-down violation on task "${task.title}". Reason: ${reason || 'Unknown'}`,
                    kind: 'VIOLATION'
                }
            });
        }));
        res.json({ success: true, autoBlocked });
    } catch (e) {
        res.status(500).json({ error: 'Failed to report violation' });
    }
});

exports.default = router;


