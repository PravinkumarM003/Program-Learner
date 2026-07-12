"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");

const router = express_1.default.Router();

// Get certificate status for a course
router.get('/:courseId', auth_1.authenticateJWT, async (req, res) => {
    try {
        const certificate = await prisma_1.prisma.certificate.findUnique({
            where: {
                userId_courseId: {
                    userId: req.user.id,
                    courseId: req.params.courseId
                }
            }
        });
        res.json({ certificate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch certificate status' });
    }
});

// Request a certificate
router.post('/request/:courseId', auth_1.authenticateJWT, async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.user.id;

        // Check if course exists
        const course = await prisma_1.prisma.course.findUnique({
            where: { id: courseId },
            include: { lessons: true }
        });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Check if user has already requested
        const existing = await prisma_1.prisma.certificate.findUnique({
            where: {
                userId_courseId: { userId, courseId }
            }
        });
        if (existing) {
            return res.status(400).json({ error: 'Certificate already requested' });
        }

        // Check completion status
        const progress = await prisma_1.prisma.lessonProgress.findMany({
            where: {
                userId,
                lessonId: { in: course.lessons.map(l => l.id) },
                completed: true
            }
        });

        const completedCount = progress.length;
        const totalLessons = course.lessons.length;

        if (completedCount < totalLessons || totalLessons === 0) {
            return res.status(400).json({ error: 'You have not completed all lessons in this course yet.' });
        }

        const totalXp = progress.reduce((sum, p) => sum + p.xp, 0);

        const certificate = await prisma_1.prisma.certificate.create({
            data: {
                userId,
                courseId,
                status: 'PENDING',
                xpEarned: totalXp,
                lessonsCompleted: completedCount
            }
        });
        
        // Notify admins
        const admins = await prisma_1.prisma.user.findMany({ where: { role: 'ADMIN' } });
        await Promise.all(admins.map(admin => prisma_1.prisma.notification.create({
            data: {
                userId: admin.id,
                title: 'New Certificate Request',
                body: `${req.user.name || req.user.email} requested a certificate for ${course.title}.`,
                kind: 'SYSTEM'
            }
        })));

        res.json({ message: 'Certificate requested successfully', certificate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to request certificate' });
    }
});

exports.default = router;
