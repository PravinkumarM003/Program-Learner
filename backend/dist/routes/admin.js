"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();

async function notifyStudents(title, body) {
    const users = await prisma_1.prisma.user.findMany();
    await Promise.all(users.map(user => {
        return prisma_1.prisma.notification.create({
            data: {
                userId: user.id,
                title,
                body,
                kind: 'SYSTEM'
            }
        });
    }));
}
router.get('/submissions', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN', 'TEACHER'), async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
        prisma_1.prisma.submission.findMany({
            include: { task: true, user: true, versions: true },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma_1.prisma.submission.count()
    ]);

    res.json({ submissions, total, page, totalPages: Math.ceil(total / limit) });
});
router.post('/submissions/:id/review', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN', 'TEACHER'), async (req, res) => {
    const { id } = req.params;
    const { status, marks, feedback } = req.body;
    if (!['Accepted', 'Rejected', 'UnderReview'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    const currentSubmission = await prisma_1.prisma.submission.findUnique({ where: { id }, include: { task: true } });
    if (!currentSubmission) return res.status(404).json({ error: 'Submission not found' });

    // Only calculate new XP if marks are being set and status is Accepted
    let newEarnedXp = currentSubmission.earnedXp || 0; // keep existing by default
    const marksValue = (marks !== undefined && marks !== null && marks !== '') ? Number(marks) : null;

    if (status === 'Accepted' && marksValue !== null && marksValue > 0) {
        const max = currentSubmission.task.maxMarks || 100;
        newEarnedXp = Math.floor((marksValue / max) * (currentSubmission.task.baseXp || 0));
    } else if (status !== 'Accepted') {
        newEarnedXp = 0; // No XP for rejected/under-review
    }

    // Compute XP delta to avoid double-counting
    const oldEarnedXp = currentSubmission.earnedXp || 0;
    const xpDelta = newEarnedXp - oldEarnedXp;

    const submission = await prisma_1.prisma.submission.update({
        where: { id },
        data: {
            status,
            marks: marksValue,
            feedback: feedback || null,
            earnedXp: newEarnedXp,
            reviewBy: req.user?.sub,
            reviewedAt: new Date(),
            acceptedAt: status === 'Accepted' ? new Date() : (status === 'Rejected' ? null : undefined),
            rejectedAt: status === 'Rejected' ? new Date() : (status === 'Accepted' ? null : undefined)
        },
        include: { task: true, user: true, versions: true }
    });

    // Update leaderboard with delta only (prevents double-counting)
    if (xpDelta !== 0) {
        await prisma_1.prisma.leaderboard.upsert({
            where: { userId: submission.userId },
            update: { xp: { increment: xpDelta } },
            create: { userId: submission.userId, xp: Math.max(0, xpDelta) }
        });
    }

    res.json({ submission });
});

router.get('/users', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN'), async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        prisma_1.prisma.user.findMany({
            select: { id: true, email: true, name: true, role: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma_1.prisma.user.count()
    ]);

    res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
});

// Role change endpoint
router.patch('/users/:id/role', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const validRoles = ['USER', 'TEACHER', 'ADMIN'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be USER, TEACHER, or ADMIN.' });
        }
        const user = await prisma_1.prisma.user.update({
            where: { id },
            data: { role },
            select: { id: true, email: true, name: true, role: true }
        });
        res.json({ user });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update role' });
    }
});

router.post('/lessons', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const { title, content, notes, videoUrl, difficulty, category } = req.body;
        const lessonCategory = category || 'C';
        let course = await prisma_1.prisma.course.findFirst({ where: { title: lessonCategory } });
        if (!course) {
            course = await prisma_1.prisma.course.create({ data: { title: lessonCategory } });
        }
        const count = await prisma_1.prisma.lesson.count({ where: { courseId: course.id } });
        const lesson = await prisma_1.prisma.lesson.create({
            data: {
                title,
                content,
                notes,
                videoUrl,
                category: category || 'C',
                difficulty: difficulty || 'Beginner',
                order: count + 1,
                courseId: course.id
            }
        });
        
        await notifyStudents('New Lesson Available!', `A new lesson "${lesson.title}" has been added.`);
        
        res.json({ lesson });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create lesson' });
    }
});

router.get('/lessons', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN', 'TEACHER'), async (req, res) => {
    const lessons = await prisma_1.prisma.lesson.findMany({
        orderBy: { createdAt: 'desc' }
    });
    res.json({ lessons });
});

router.delete('/lessons/:id', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.lesson.delete({ where: { id } });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete lesson' });
    }
});

router.get('/violations', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN'), async (req, res) => {
    try {
        const userId = req.user?.sub;
        const violations = await prisma_1.prisma.notification.findMany({
            where: { userId, kind: { in: ['VIOLATION', 'SECURITY_ALERT'] } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ violations });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch violations' });
    }
});

router.get('/blocked-ips', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN'), async (_req, res) => {
    try {
        const blockedIps = await prisma_1.prisma.blockedIp.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ blockedIps });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch blocked IPs' });
    }
});

router.post('/blocked-ips', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN'), async (req, res) => {
    try {
        const { ip, reason } = req.body;
        const normalizedIp = String(ip || '').trim();
        if (!normalizedIp) {
            return res.status(400).json({ error: 'IP address is required' });
        }
        const blockedIp = await prisma_1.prisma.blockedIp.upsert({
            where: { ip: normalizedIp },
            update: {
                reason: reason || null,
                blockedBy: req.user?.sub || null
            },
            create: {
                ip: normalizedIp,
                reason: reason || null,
                blockedBy: req.user?.sub || null
            }
        });
        res.status(201).json({ blockedIp });
    } catch (e) {
        res.status(500).json({ error: 'Failed to block IP' });
    }
});

router.delete('/blocked-ips/:ip', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN'), async (req, res) => {
    try {
        const ip = decodeURIComponent(req.params.ip);
        await prisma_1.prisma.blockedIp.delete({ where: { ip } });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to unblock IP' });
    }
});

router.post('/notifications/broadcast', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN'), async (req, res) => {
    try {
        const { title, message } = req.body;
        if (!title || !message) return res.status(400).json({ error: 'Title and message required' });
        await notifyStudents(title, message);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to broadcast notification' });
    }
});

exports.default = router;
