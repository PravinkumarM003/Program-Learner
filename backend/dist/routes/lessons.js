"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();

router.get('/', async (_req, res) => {
    try {
        const lessons = await prisma_1.prisma.lesson.findMany({
            include: { course: true },
            orderBy: { order: 'asc' }
        });
        res.json({ lessons });
    } catch (e) {
        console.error('[LESSONS] GET / error:', e?.message || e);
        res.status(500).json({ error: 'Failed to fetch lessons list' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const lesson = await prisma_1.prisma.lesson.findUnique({
            where: { id: String(req.params.id) },
            include: { course: true }
        });
        if (!lesson)
            return res.status(404).json({ error: 'Lesson not found' });
        res.json({ lesson });
    } catch (e) {
        console.error(`[LESSONS] GET /:id (${req.params.id}) error:`, e?.message || e);
        res.status(500).json({ error: 'Failed to fetch lesson details' });
    }
});

router.post('/:id/complete', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });
        
        const lessonId = req.params.id;
        
        const progress = await prisma_1.prisma.lessonProgress.findFirst({
            where: { userId, lessonId }
        });
        
        if (progress) {
            await prisma_1.prisma.lessonProgress.update({
                where: { id: progress.id },
                data: { completed: true, xp: 10 }
            });
        } else {
            await prisma_1.prisma.lessonProgress.create({
                data: {
                    userId,
                    lessonId,
                    completed: true,
                    xp: 10
                }
            });
        }
        
        // Return 200 OK with XP so the frontend shows the completion toast
        res.json({ success: true, xp: 10 });
    } catch (e) {
        res.status(500).json({ error: 'Failed to mark lesson as complete' });
    }
});

exports.default = router;
