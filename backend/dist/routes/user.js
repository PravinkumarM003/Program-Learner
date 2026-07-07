"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const express_rate_limit_1 = require("express-rate-limit");
const router = (0, express_1.Router)();

// Stricter rate limit for AI endpoint (5 requests per minute)
const aiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 5,
    message: { error: 'Too many AI requests. Please wait a minute before trying again.' }
});
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

// ── In-memory cache for leaderboard (refreshes every 2 minutes) ───────────────
const _lbCache = { data: null, expiresAt: 0 };

router.get('/leaderboard', async (req, res) => {
    try {
        // Serve from cache if still valid
        if (_lbCache.data && Date.now() < _lbCache.expiresAt) {
            return res.json({ leaderboard: _lbCache.data, cached: true });
        }
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
        // Cache for 2 minutes
        _lbCache.data = leaderboard;
        _lbCache.expiresAt = Date.now() + 2 * 60 * 1000;
        res.json({ leaderboard });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

router.post('/ask-ai', aiLimiter, auth_1.authenticateJWT, async (req, res) => {
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

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.json({ answer: "⚠️ GEMINI_API_KEY is not configured on the server. Please contact your administrator." });
        }

        const { GoogleGenAI } = require("@google/genai");
        const ai = new GoogleGenAI({ apiKey });
        const userQuery = messages && messages.length > 0 ? messages[messages.length - 1].content : "help";
        
        let aiText = "";
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `You are an expert programming assistant helping a student. Be concise and helpful. Query: ${userQuery}`,
            });
            aiText = response.text;
        } catch (apiError) {
            console.error("AI API Error:", apiError);
            return res.json({ answer: "⚠️ Failed to reach the AI service. Please try again later." });
        }

        // Deduct 50 XP only if AI request succeeded
        await prisma_1.prisma.leaderboard.update({
            where: { userId },
            data: { spentXp: { increment: 50 } }
        });

        res.json({ answer: aiText });
    } catch (e) {
        console.error("Ask AI Error:", e);
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

// ── Achievements ──────────────────────────────────────────
router.get('/achievements', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const allAchievements = await prisma_1.prisma.achievement.findMany({
            orderBy: { createdAt: 'asc' }
        });
        const userAchievements = await prisma_1.prisma.userAchievement.findMany({
            where: { userId },
            select: { achievementId: true, unlockedAt: true }
        });
        const unlockedMap = {};
        userAchievements.forEach(ua => { unlockedMap[ua.achievementId] = ua.unlockedAt; });

        const achievements = allAchievements.map(a => ({
            ...a,
            unlocked: !!unlockedMap[a.id],
            unlockedAt: unlockedMap[a.id] || null
        }));

        res.json({ achievements });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
});

// Check and award achievements after actions
router.post('/achievements/check', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const newlyUnlocked = [];

        // Fetch user stats
        const [submissions, lessonProgress, leaderboard] = await Promise.all([
            prisma_1.prisma.submission.findMany({ where: { userId } }),
            prisma_1.prisma.lessonProgress.findMany({ where: { userId, completed: true } }),
            prisma_1.prisma.leaderboard.findUnique({ where: { userId } })
        ]);

        const allAchievements = await prisma_1.prisma.achievement.findMany();
        const existing = await prisma_1.prisma.userAchievement.findMany({
            where: { userId },
            select: { achievementId: true }
        });
        const existingIds = new Set(existing.map(e => e.achievementId));

        const totalSubs = submissions.length;
        const acceptedSubs = submissions.filter(s => s.status === 'Accepted').length;
        const perfectSubs = submissions.filter(s => s.marks != null && s.task?.maxMarks != null && s.marks >= s.task?.maxMarks).length;
        const totalLessons = lessonProgress.length;

        // Define criteria checks
        const checks = {
            'first_submission': totalSubs >= 1,
            'five_submissions': totalSubs >= 5,
            'ten_accepted': acceptedSubs >= 10,
            'lesson_5': totalLessons >= 5,
            'lesson_10': totalLessons >= 10,
            'xp_100': (leaderboard?.xp || 0) >= 100,
            'xp_500': (leaderboard?.xp || 0) >= 500,
            'xp_1000': (leaderboard?.xp || 0) >= 1000,
        };

        for (const achievement of allAchievements) {
            if (existingIds.has(achievement.id)) continue;
            const criteriaKey = achievement.criteria;
            if (criteriaKey && checks[criteriaKey]) {
                await prisma_1.prisma.userAchievement.create({
                    data: { userId, achievementId: achievement.id }
                });
                // Award XP bonus
                if (achievement.xpReward > 0 && leaderboard) {
                    await prisma_1.prisma.leaderboard.update({
                        where: { userId },
                        data: { xp: { increment: achievement.xpReward } }
                    });
                }
                newlyUnlocked.push(achievement);
            }
        }

        res.json({ newlyUnlocked });
    } catch (e) {
        res.status(500).json({ error: 'Failed to check achievements' });
    }
});

exports.default = router;
