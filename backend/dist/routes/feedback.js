"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();

// Submit feedback
router.post('/', (0, validation_1.validateBody)(validation_1.createFeedbackSchema), async (req, res) => {
    try {
        const { name, email, rating, message } = req.body;
        const feedback = await prisma_1.prisma.feedback.create({
            data: {
                name: name || null,
                email,
                rating: Number(rating),
                message
            }
        });
        res.status(201).json({ success: true, feedback });
    } catch (e) {
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
});

// Admin-only get feedbacks
router.get('/', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN'), async (req, res) => {
    try {
        const feedbacks = await prisma_1.prisma.feedback.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ feedbacks });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

exports.default = router;
