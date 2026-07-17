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

// Initialize blocked IPs cache globally
global.blockedIpsCache = new Set();
prisma_1.prisma.blockedIp.findMany({ select: { ip: true } })
    .then(ips => {
        ips.forEach(item => global.blockedIpsCache.add(item.ip));
    })
    .catch(err => console.error('Failed to load blocked IPs cache:', err));

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
const allowedOrigins = [
    'https://program-learner.vercel.app',
    'https://program-learner.onrender.com',
    'https://program-learner-backend.onrender.com',
    'http://localhost:5173',
    'http://localhost:4173'
];
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Still allow unknown origins in development, but log them
        console.warn(`[CORS] Request from unlisted origin: ${origin}`);
        return callback(null, true);
    },
    methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 204,
    maxAge: 86400 // Cache preflight for 24 hours
};
app.use((0, cors_1.default)(corsOptions));
// Explicit preflight handler — ensures Render's proxy never returns a bare 502 for OPTIONS
app.options('*', (0, cors_1.default)(corsOptions));

app.use((req, res, next) => {
    const ip = getClientIp(req);
    if (global.blockedIpsCache && global.blockedIpsCache.has(ip)) {
        return res.status(403).json({ error: 'This IP address has been blocked by the administrator.' });
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

// CSRF removed for Bearer token auth

const jwt_1 = require("./utils/jwt");
app.use(async (req, res, next) => {
    const ip = getClientIp(req);
    let userId = 'unauthenticated';
    let userEmail = 'unauthenticated';
    try {
        const authHeader = req.headers.authorization;
        let token = req.cookies?.access_token;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        if (token) {
            const payload = (0, jwt_1.verifyAccessToken)(token);
            if (payload) {
                userId = payload.sub || 'unknown';
                userEmail = payload.email || 'unknown';
            }
        }
    } catch (err) {}

    const requestText = `${req.method} ${req.originalUrl} ${JSON.stringify(req.query || {})} ${JSON.stringify(req.body || {})}`.slice(0, 5000);
    if (suspiciousPatterns.some(pattern => pattern.test(requestText))) {
        await notifyAdmins(
            '🛑 Hacking Attempt Blocked',
            `Suspicious request detected from IP: ${ip} (User ID: ${userId}, Email: ${userEmail})\nRequest: ${req.method} ${req.originalUrl}`,
            {
                ip,
                userId,
                userEmail,
                method: req.method,
                url: req.originalUrl,
                userAgent: req.headers['user-agent'] || 'unknown'
            }
        );
        return res.status(400).json({ error: 'Suspicious request pattern or malicious payload detected.' });
    }
    next();
});

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

app.use((err, req, res, _next) => {
    // Global error handler — catches unhandled sync/async errors from Express
    const status = err.status || 500;
    console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message || err);
    // Ensure CORS headers are present even on error responses
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.status(status).json({ error: err.message || 'Internal Server Error' });
});
exports.default = app;
