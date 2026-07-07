"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/me', async (req, res) => {
    try {
        const jwt_1 = require("../utils/jwt");
        const authHeader = req.headers.authorization;
        let token = req.cookies?.access_token;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        if (!token) return res.json({ user: null });
        
        const payload = (0, jwt_1.verifyAccessToken)(token);
        const userId = payload.sub;
        if (!userId) return res.json({ user: null });

        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, role: true, createdAt: true }
        });
        if (!user) return res.json({ user: null });
        res.json({ user });
    } catch(err) {
        return res.json({ user: null });
    }
});

router.get('/xp', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const [lessonProgress, submissions, leaderboard] = await Promise.all([
            prisma_1.prisma.lessonProgress.findMany({ where: { userId }, select: { xp: true } }),
            prisma_1.prisma.submission.findMany({ where: { userId }, select: { earnedXp: true, marks: true, status: true } }),
            prisma_1.prisma.leaderboard.findUnique({ where: { userId }, select: { xp: true, spentXp: true } })
        ]);

        const lessonXp = lessonProgress.reduce((sum, p) => sum + (p.xp || 0), 0);
        const taskXp = submissions.reduce((sum, s) => sum + (s.earnedXp || 0), 0);
        const totalXp = leaderboard ? leaderboard.xp : (lessonXp + taskXp);
        const spentXp = leaderboard ? leaderboard.spentXp : 0;
        const currentXp = Math.max(0, totalXp - spentXp);
        const totalMarks = submissions.reduce((sum, s) => sum + (s.marks || 0), 0);

        res.json({ xp: totalXp, currentXp, spentXp, lessonXp, taskXp, totalMarks });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch XP' });
    }
});

router.get('/leaderboard', async (req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                submissions: {
                    select: { marks: true }
                },
                lessonProgress: {
                    select: { xp: true }
                }
            }
        });
        
        const leaderboard = users.map(u => {
            const marksScore = u.submissions.reduce((sum, s) => sum + (s.marks || 0), 0);
            const xpScore = u.lessonProgress.reduce((sum, p) => sum + (p.xp || 0), 0);
            return {
                id: u.id,
                name: u.name || u.email,
                score: marksScore + xpScore
            };
        }).sort((a, b) => b.score - a.score).slice(0, 50); // Top 50
        
        res.json({ leaderboard });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

router.post('/ask-ai', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const leaderboard = await prisma_1.prisma.leaderboard.findUnique({ where: { userId } });
        const totalXp = leaderboard ? leaderboard.xp : 0;
        const spentXp = leaderboard ? leaderboard.spentXp : 0;
        const currentXp = Math.max(0, totalXp - spentXp);

        if (currentXp < 50) {
            return res.status(400).json({ error: 'Not enough XP to use Ask AI (requires 50 XP).' });
        }

        // Deduct 50 XP
        await prisma_1.prisma.leaderboard.update({
            where: { userId },
            data: { spentXp: { increment: 50 } }
        });

        // Mock AI response
        res.json({ answer: 'AI Hint:\n\nBased on your code, you might want to check the indentation and ensure you are returning the expected value.' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to process AI request' });
    }
});
exports.default = router;
