"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.sub;
        const { taskId, code, status } = req.body;
        if (!userId)
            return res.status(401).json({ error: 'Authentication required' });
        if (!taskId || !code)
            return res.status(400).json({ error: 'Missing task or code' });
        const submission = await prisma_1.prisma.submission.create({
            data: {
                taskId,
                userId,
                status: status || 'Pending',
                versions: {
                    create: [{ code }]
                }
            },
            include: { versions: true }
        });
        res.status(201).json({ submission });
    } catch (e) {
        console.error('[SUBMISSIONS] POST / error:', e?.message || e);
        res.status(500).json({ error: 'Failed to create submission' });
    }
});
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId)
            return res.status(401).json({ error: 'Authentication required' });
        const submissions = await prisma_1.prisma.submission.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { versions: true, task: true }
        });
        res.json({ submissions });
    } catch (e) {
        console.error('[SUBMISSIONS] GET / error:', e?.message || e);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});
exports.default = router;
