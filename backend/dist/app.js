"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const courses_1 = __importDefault(require("./routes/courses"));
const lessons_1 = __importDefault(require("./routes/lessons"));
const progress_1 = __importDefault(require("./routes/progress"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const submissions_1 = __importDefault(require("./routes/submissions"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const admin_1 = __importDefault(require("./routes/admin"));
const attachments_1 = __importDefault(require("./routes/attachments"));
const feedback_1 = __importDefault(require("./routes/feedback"));
const prisma_1 = require("./prisma");
const app = (0, express_1.default)();
app.set('trust proxy', 1);
function getClientIp(req) {
    return String(req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}
const suspiciousPatterns = [
    /\.\.\//i,
    /<script/i,
    /union\s+select/i,
    /information_schema/i,
    /\/wp-admin/i,
    /\/phpmyadmin/i,
    /\/\.env/i,
    /cmd=/i,
    /exec\(/i
];
async function notifyAdmins(title, body, meta = {}) {
    try {
        const admins = await prisma_1.prisma.user.findMany({ where: { role: 'ADMIN' } });
        await Promise.all(admins.map(admin => prisma_1.prisma.notification.create({
            data: {
                userId: admin.id,
                title,
                body,
                kind: 'SECURITY_ALERT'
            }
        })));
        await prisma_1.prisma.activityLog.create({
            data: {
                action: 'SECURITY_ALERT',
                meta: JSON.stringify(meta)
            }
        });
    }
    catch (e) { }
}
app.use(async (req, res, next) => {
    const ip = getClientIp(req);
    try {
        const blocked = await prisma_1.prisma.blockedIp.findUnique({ where: { ip } });
        if (blocked) {
            return res.status(403).json({ error: 'This IP address has been blocked by the administrator.' });
        }
    }
    catch (e) { }
    const requestText = `${req.method} ${req.originalUrl} ${JSON.stringify(req.query || {})}`.slice(0, 2000);
    if (suspiciousPatterns.some(pattern => pattern.test(requestText))) {
        await notifyAdmins('Security alert: suspicious request', `Suspicious request detected from IP ${ip}: ${req.method} ${req.originalUrl}`, {
            ip,
            method: req.method,
            url: req.originalUrl,
            userAgent: req.headers['user-agent'] || 'unknown'
        });
    }
    next();
});
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://accounts.google.com', 'https://apis.google.com'],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'", 'https:'],
            fontSrc: ["'self'", 'https:'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    }
}));
app.use(express_1.default.json({ limit: '15kb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || true,
    credentials: true
}));

// CSRF removed for Bearer token auth

const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    handler: async (req, res) => {
        const ip = getClientIp(req);
        await notifyAdmins('Security alert: request limit reached', `IP ${ip} crossed the request limit and may need review.`, {
            ip,
            method: req.method,
            url: req.originalUrl,
            userAgent: req.headers['user-agent'] || 'unknown'
        });
        res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 auth requests per window
    handler: async (req, res) => {
        const ip = getClientIp(req);
        await notifyAdmins('Security alert: auth request limit reached', `IP ${ip} crossed the auth request limit.`, {
            ip,
            method: req.method,
            url: req.originalUrl,
            userAgent: req.headers['user-agent'] || 'unknown'
        });
        res.status(429).json({ error: 'Too many login attempts. Please try again after 15 minutes.' });
    }
});

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', 'uploads')));
app.use('/api/auth', auth_1.default);
app.use('/api/user', user_1.default);
app.use('/api/courses', courses_1.default);
app.use('/api/lessons', lessons_1.default);
app.use('/api/progress', progress_1.default);
app.use('/api/tasks', tasks_1.default);
app.use('/api/submissions', submissions_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/attachments', attachments_1.default);
app.use('/api/feedback', feedback_1.default);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err, _req, res, _next) => {
    // basic error handler
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
});
exports.default = app;
