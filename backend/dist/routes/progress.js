"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const progress = await prisma_1.prisma.lessonProgress.findMany({
            where: { userId },
            include: { lesson: true }
        });
        res.json({ progress });
    } catch (e) {
        console.error('[PROGRESS] GET / error:', e?.message || e);
        res.status(500).json({ error: 'Failed to fetch user progress' });
    }
});
router.post('/complete', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.sub;
        const { lessonId } = req.body;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!lessonId)
            return res.status(400).json({ error: 'Missing lessonId' });
        const lesson = await prisma_1.prisma.lesson.findUnique({ where: { id: lessonId } });
        if (!lesson)
            return res.status(404).json({ error: 'Lesson not found' });
        const progress = await prisma_1.prisma.lessonProgress.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            update: { completed: true, xp: lesson.difficulty === 'Advanced' ? 50 : lesson.difficulty === 'Intermediate' ? 35 : 20, completedAt: new Date(), lastViewedAt: new Date() },
            create: { userId, lessonId, completed: true, xp: lesson.difficulty === 'Advanced' ? 50 : lesson.difficulty === 'Intermediate' ? 35 : 20, completedAt: new Date(), lastViewedAt: new Date() }
        });
        
        // Add 10 flat XP for completing the lesson to Leaderboard
        await prisma_1.prisma.leaderboard.upsert({
            where: { userId },
            update: { xp: { increment: 10 } },
            create: { userId, xp: 10 }
        });

        res.json({ progress });
    } catch (e) {
        console.error('[PROGRESS] POST /complete error:', e?.message || e);
        res.status(500).json({ error: 'Failed to record lesson completion' });
    }
});
exports.default = router;
