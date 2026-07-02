"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const realPrisma = new client_1.PrismaClient();

const now = new Date();
const users = [
    { id: 'dev-admin', email: 'admin@pylearn.dev', name: 'Dev Admin', role: 'ADMIN', createdAt: now, updatedAt: now },
    { id: 'dev-student', email: 'student@pylearn.dev', name: 'Dev Student', role: 'STUDENT', createdAt: now, updatedAt: now }
];
const lessons = [
    { id: 'lesson-python-basics', courseId: 'course-python', title: 'Python Basics', content: 'Learn variables, printing, and simple expressions in Python.', notes: 'Try changing values and running the examples.', difficulty: 'Beginner', order: 1, createdAt: now, updatedAt: now },
    { id: 'lesson-conditions', courseId: 'course-python', title: 'Conditions', content: 'Use if, elif, and else to make decisions in your programs.', notes: 'Boolean expressions decide which branch runs.', difficulty: 'Beginner', order: 2, createdAt: now, updatedAt: now }
];
const courses = [
    { id: 'course-python', title: 'Python Starter', description: 'A practical first course for writing and running Python programs.', createdAt: now, updatedAt: now }
];
const tasks = [
    { id: 'task-hello-python', title: 'Print a Greeting', description: 'Write a Python program that prints Hello, PyLearn!', type: 'CODE', difficulty: 'Beginner', deadline: null, published: true, isDraft: false, sampleInput: '', sampleOutput: 'Hello, PyLearn!', hints: 'Use the print function.', starterCode: 'print("Hello, PyLearn!")', testCases: '', createdAt: now, updatedAt: now, quizQuestions: [] },
    { id: 'task-python-quiz', title: 'Python Basics Quiz', description: 'Check your understanding of Python fundamentals.', type: 'QUIZ', difficulty: 'Beginner', deadline: null, published: true, isDraft: false, sampleInput: '', sampleOutput: '', hints: '', starterCode: '', testCases: '', createdAt: now, updatedAt: now, quizQuestions: [
            { id: 'quiz-q1', taskId: 'task-python-quiz', question: 'Which function displays text in Python?', options: JSON.stringify(['print', 'echo', 'show']), answer: 'print', order: 1, createdAt: now, updatedAt: now }
        ] }
];
const lessonProgress = [];
const submissions = [];
const blockedIps = [];

function withCourse(lesson) {
    return { ...lesson, course: courses.find(course => course.id === lesson.courseId) || null };
}
function withLessons(course) {
    return { ...course, lessons: lessons.filter(lesson => lesson.courseId === course.id).sort((a, b) => a.order - b.order) };
}
function matchesWhere(item, where = {}) {
    return Object.entries(where).every(([key, value]) => item[key] === value);
}
const fallbackPrisma = {
    user: {
        async findUnique(args = {}) {
            const where = args.where || {};
            const user = users.find(u => Object.entries(where).every(([key, value]) => u[key] === value));
            if (!user)
                return null;
            if (args.select) {
                return Object.fromEntries(Object.keys(args.select).filter(key => args.select[key]).map(key => [key, user[key]]));
            }
            return user;
        },
        async findMany() {
            return users.map(user => ({ ...user, submissions: [], lessonProgress }));
        },
        async create(args = {}) {
            const user = { id: `dev-user-${users.length + 1}`, role: 'STUDENT', createdAt: new Date(), updatedAt: new Date(), ...args.data };
            users.push(user);
            return user;
        },
        async update(args = {}) {
            const user = users.find(u => u.id === args.where?.id);
            if (!user)
                throw new Error('User not found');
            Object.assign(user, args.data, { updatedAt: new Date() });
            return user;
        }
    },
    course: {
        async findMany() { return courses.map(withLessons); },
        async findUnique(args = {}) {
            const course = courses.find(c => c.id === args.where?.id);
            return course ? withLessons(course) : null;
        }
    },
    lesson: {
        async findMany() { return lessons.map(withCourse).sort((a, b) => a.order - b.order); },
        async findUnique(args = {}) {
            const lesson = lessons.find(l => l.id === args.where?.id);
            return lesson ? withCourse(lesson) : null;
        }
    },
    lessonProgress: {
        async findMany(args = {}) { return lessonProgress.filter(p => matchesWhere(p, args.where)); },
        async findFirst(args = {}) { return lessonProgress.find(p => matchesWhere(p, args.where)) || null; },
        async create(args = {}) {
            const progress = { id: `progress-${lessonProgress.length + 1}`, xp: 0, completed: false, updatedAt: new Date(), ...args.data };
            lessonProgress.push(progress);
            return progress;
        },
        async update(args = {}) {
            const progress = lessonProgress.find(p => p.id === args.where?.id);
            if (!progress)
                throw new Error('Progress not found');
            Object.assign(progress, args.data, { updatedAt: new Date() });
            return progress;
        }
    },
    task: {
        async findMany(args = {}) {
            const where = args.where || {};
            return tasks.filter(task => Object.entries(where).every(([key, value]) => task[key] === value));
        },
        async findUnique(args = {}) {
            return tasks.find(task => task.id === args.where?.id) || null;
        },
        async create(args = {}) {
            const task = { id: `task-${tasks.length + 1}`, createdAt: new Date(), updatedAt: new Date(), published: false, isDraft: true, quizQuestions: [], ...args.data };
            tasks.push(task);
            return task;
        },
        async update(args = {}) {
            const task = tasks.find(t => t.id === args.where?.id);
            if (!task)
                throw new Error('Task not found');
            Object.assign(task, args.data, { updatedAt: new Date() });
            return task;
        },
        async delete(args = {}) {
            const index = tasks.findIndex(t => t.id === args.where?.id);
            if (index >= 0)
                return tasks.splice(index, 1)[0];
            throw new Error('Task not found');
        }
    },
    quizQuestion: {
        async deleteMany() { return { count: 0 }; }
    },
    submission: {
        async findMany(args = {}) { return submissions.filter(submission => matchesWhere(submission, args.where)); },
        async findUnique(args = {}) {
            const where = args.where || {};
            if (where.taskId_userId) {
                return submissions.find(s => s.taskId === where.taskId_userId.taskId && s.userId === where.taskId_userId.userId) || null;
            }
            return submissions.find(s => s.id === where.id) || null;
        },
        async create(args = {}) {
            const submission = { id: `submission-${submissions.length + 1}`, status: 'Pending', marks: null, feedback: null, createdAt: new Date(), updatedAt: new Date(), submittedAt: new Date(), versions: [], ...args.data };
            if (args.data?.versions?.create)
                submission.versions = args.data.versions.create;
            submissions.push(submission);
            return submission;
        },
        async update(args = {}) {
            const submission = submissions.find(s => s.id === args.where?.id);
            if (!submission)
                throw new Error('Submission not found');
            Object.assign(submission, args.data, { updatedAt: new Date() });
            if (args.data?.versions?.create)
                submission.versions.push(...args.data.versions.create);
            return submission;
        }
    },
    loginLog: {
        async create() { return { id: `login-${Date.now()}` }; }
    },
    activityLog: { async create() { return {}; }, async findMany() { return []; } },
    notification: { async findMany() { return []; } },
    blockedIp: {
        async findMany() { return blockedIps.sort((a, b) => b.createdAt - a.createdAt); },
        async findUnique(args = {}) {
            return blockedIps.find(item => item.ip === args.where?.ip) || null;
        },
        async upsert(args = {}) {
            const existing = blockedIps.find(item => item.ip === args.where?.ip);
            if (existing) {
                Object.assign(existing, args.update || {});
                return existing;
            }
            const blockedIp = { id: `blocked-ip-${blockedIps.length + 1}`, createdAt: new Date(), ...args.create };
            blockedIps.push(blockedIp);
            return blockedIp;
        },
        async delete(args = {}) {
            const index = blockedIps.findIndex(item => item.ip === args.where?.ip);
            if (index >= 0)
                return blockedIps.splice(index, 1)[0];
            throw new Error('Blocked IP not found');
        }
    },
    attachment: { async findMany() { return []; }, async create(args = {}) { return { id: `attachment-${Date.now()}`, ...args.data }; } }
};

function isDatabaseUnavailable(error) {
    const message = String(error?.message || error || '');
    return message.includes("Can't reach database server") || message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT') || message.includes('P1001') || message.includes('P2021') || message.includes("does not exist");
}
function modelProxy(modelName) {
    return new Proxy(realPrisma[modelName] || {}, {
        get(target, property) {
            const realValue = target[property];
            const fallbackValue = fallbackPrisma[modelName]?.[property];
            if (typeof realValue !== 'function')
                return realValue;
            return async (...args) => {
                try {
                    return await realValue.apply(target, args);
                }
                catch (error) {
                    if (fallbackValue && isDatabaseUnavailable(error)) {
                        console.warn(`Database unavailable; using local fallback for ${modelName}.${String(property)}.`);
                        return fallbackValue(...args);
                    }
                    throw error;
                }
            };
        }
    });
}
exports.prisma = new Proxy(realPrisma, {
    get(target, property) {
        if (fallbackPrisma[property])
            return modelProxy(property);
        return target[property];
    }
});
