"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFeedbackSchema = exports.updateTaskSchema = exports.createTaskSchema = exports.validateBody = void 0;
const zod_1 = require("zod");

function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: result.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))
            });
        }
        req.body = result.data;
        next();
    };
}
exports.validateBody = validateBody;

exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required").max(100),
    description: zod_1.z.string().min(1, "Description is required"),
    type: zod_1.z.enum(['GENERAL', 'CODE', 'QUIZ']).default('CODE'),
    difficulty: zod_1.z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Beginner'),
    deadline: zod_1.z.string().datetime({ nullable: true }).or(zod_1.z.null()).optional(),
    baseXp: zod_1.z.number().int().nonnegative().default(0),
    targetTime: zod_1.z.number().int().positive().nullable().optional(),
    maxMarks: zod_1.z.number().int().positive().nullable().optional(),
    sampleInput: zod_1.z.string().optional().nullable(),
    sampleOutput: zod_1.z.string().optional().nullable(),
    hints: zod_1.z.string().optional().nullable(),
    starterCode: zod_1.z.string().optional().nullable(),
    testCases: zod_1.z.string().optional().nullable(),
    isDraft: zod_1.z.boolean().default(true),
    quizQuestions: zod_1.z.array(zod_1.z.object({
        question: zod_1.z.string().min(1),
        options: zod_1.z.array(zod_1.z.string()),
        answer: zod_1.z.string().min(1),
        order: zod_1.z.number().int().optional()
    })).optional()
});

exports.updateTaskSchema = exports.createTaskSchema.partial();

exports.createFeedbackSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    name: zod_1.z.string().min(1, "Name is required").optional().nullable(),
    rating: zod_1.z.number().int().min(1).max(5).default(5),
    message: zod_1.z.string().min(1, "Message is required")
});
