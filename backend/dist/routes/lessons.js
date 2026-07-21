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
        const LESSON_XP = 10;
        
        const progress = await prisma_1.prisma.lessonProgress.findFirst({
            where: { userId, lessonId }
        });
        
        let earnedNewXp = false;
        if (progress) {
            if (!progress.completed) {
                earnedNewXp = true;
                await prisma_1.prisma.lessonProgress.update({
                    where: { id: progress.id },
                    data: { completed: true, xp: LESSON_XP, completedAt: new Date() }
                });
            }
        } else {
            earnedNewXp = true;
            await prisma_1.prisma.lessonProgress.create({
                data: {
                    userId,
                    lessonId,
                    completed: true,
                    xp: LESSON_XP,
                    completedAt: new Date()
                }
            });
        }
        
        if (earnedNewXp) {
            await prisma_1.prisma.leaderboard.upsert({
                where: { userId },
                update: { xp: { increment: LESSON_XP } },
                create: { userId, xp: LESSON_XP }
            });
        }
        
        res.json({ success: true, xp: earnedNewXp ? LESSON_XP : 0 });
    } catch (e) {
        console.error('[LESSONS] POST /:id/complete error:', e?.message || e);
        res.status(500).json({ error: 'Failed to mark lesson as complete' });
    }
});

exports.default = router;
