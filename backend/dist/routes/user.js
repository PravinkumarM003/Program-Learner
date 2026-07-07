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
            select: { id: true, email: true, name: true, role: true, createdAt: true, unlockedThemes: true }
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
        const leaderboards = await prisma_1.prisma.leaderboard.findMany({
            include: { user: { select: { name: true, email: true } } },
            orderBy: { xp: 'desc' },
            take: 50
        });
        
        const leaderboard = leaderboards.map(lb => ({
            id: lb.userId,
            name: lb.user.name || lb.user.email,
            score: lb.xp
        }));
        
        res.json({ leaderboard });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

router.post('/ask-ai', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const { messages } = req.body;

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

        const userQuery = messages && messages.length > 0 ? messages[messages.length - 1].content : "help";
        let answer = `Here is a hint for your query: "${userQuery.substring(0, 30)}..."\n\n`;
        if (userQuery.toLowerCase().includes('error')) {
            answer += `I notice you might be facing a syntax issue. Double check your code structure.\n\n\`\`\`python\ndef fixed_function():\n    return "This works!"\n\`\`\``;
        } else {
            answer += `Consider trying a loop to iterate through the data more efficiently.\n\n\`\`\`python\nfor i in range(5):\n    print("Optimized!")\n\`\`\``;
        }

        res.json({ answer });
    } catch (e) {
        res.status(500).json({ error: 'Failed to process AI request' });
    }
});

router.post('/unlock-theme', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const { themeId, price } = req.body;
        if (!themeId || price == null) return res.status(400).json({ error: 'Missing theme info' });

        const leaderboard = await prisma_1.prisma.leaderboard.findUnique({ where: { userId } });
        const currentXp = Math.max(0, (leaderboard?.xp || 0) - (leaderboard?.spentXp || 0));

        if (currentXp < price) {
            return res.status(400).json({ error: 'Not enough XP' });
        }

        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        let themes = [];
        try {
            themes = user.unlockedThemes ? JSON.parse(user.unlockedThemes) : [];
        } catch (e) {}

        if (!themes.includes(themeId)) {
            themes.push(themeId);
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: { unlockedThemes: JSON.stringify(themes) }
            });

            if (price > 0) {
                await prisma_1.prisma.leaderboard.update({
                    where: { userId },
                    data: { spentXp: { increment: price } }
                });
            }
        }

        res.json({ success: true, unlockedThemes: themes });
    } catch (e) {
        res.status(500).json({ error: 'Failed to unlock theme' });
    }
});

router.get('/notifications', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const notifications = await prisma_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json({ notifications });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

router.post('/notifications/read', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const { notificationId } = req.body;
        if (notificationId) {
            await prisma_1.prisma.notification.updateMany({
                where: { id: notificationId, userId },
                data: { readAt: new Date() }
            });
        } else {
            await prisma_1.prisma.notification.updateMany({
                where: { userId, readAt: null },
                data: { readAt: new Date() }
            });
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

exports.default = router;
