"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    const courses = await prisma_1.prisma.course.findMany({
        include: { lessons: { orderBy: { order: 'asc' } } }
    });
    res.json({ courses });
});
router.get('/:id', async (req, res) => {
    const course = await prisma_1.prisma.course.findUnique({
        where: { id: String(req.params.id) },
        include: { lessons: { orderBy: { order: 'asc' } }, tasks: { orderBy: { createdAt: 'asc' } } }
    });
    if (!course)
        return res.status(404).json({ error: 'Course not found' });
    res.json({ course });
});
exports.default = router;
