"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN'), async (_req, res) => {
    const totalUsers = await prisma_1.prisma.user.count();
    const totalTasks = await prisma_1.prisma.task.count();
    const submissionsByStatus = await prisma_1.prisma.submission.groupBy({
        by: ['status'],
        _count: { status: true }
    });
    const topStudents = await prisma_1.prisma.lessonProgress.groupBy({
        by: ['userId'],
        _sum: { xp: true },
        orderBy: { _sum: { xp: 'desc' } },
        take: 5
    });
    res.json({ totalUsers, totalTasks, submissionsByStatus, topStudents });
});
exports.default = router;
