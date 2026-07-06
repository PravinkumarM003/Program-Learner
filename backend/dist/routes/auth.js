"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("../prisma");
const logger_1 = __importDefault(require("../logger"));
const jwt_1 = require("../utils/jwt");
dotenv_1.default.config();
const router = (0, express_1.Router)();

function getClientIp(req) {
    return String(req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

// Failed login attempt tracking
const failedAttempts = new Map();

function trackFailedLogin(ip) {
    const record = failedAttempts.get(ip) || { count: 0, lockUntil: 0 };
    record.count += 1;
    if (record.count >= 5) {
        record.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lockout
    }
    failedAttempts.set(ip, record);
}

function isLockedOut(ip) {
    const record = failedAttempts.get(ip);
    if (!record) return false;
    if (record.lockUntil > 0) {
        if (Date.now() > record.lockUntil) {
            failedAttempts.delete(ip);
            return false;
        }
        return true;
    }
    return false;
}

function clearFailedLogins(ip) {
    failedAttempts.delete(ip);
}

router.get('/dev-login', async (req, res) => {
    const ip = getClientIp(req);
    if (isLockedOut(ip)) {
        return res.status(429).json({ error: 'Too many login failures. You are temporarily locked out.' });
    }
    const role = String(req.query.role || 'ADMIN').toUpperCase();
    const email = role === 'ADMIN' ? 'admin@pylearn.dev' : 'student@pylearn.dev';
    const name = role === 'ADMIN' ? 'Dev Admin' : 'Dev Student';
    try {
        let user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma_1.prisma.user.create({ data: { email, name, role: role === 'ADMIN' ? 'ADMIN' : 'STUDENT' } });
        } else if (user.role !== role) {
            user = await prisma_1.prisma.user.update({ where: { id: user.id }, data: { role: role === 'ADMIN' ? 'ADMIN' : 'STUDENT' } });
        }
        const access = (0, jwt_1.signAccessToken)({ sub: user.id, role: user.role });
        const refresh = (0, jwt_1.signRefreshToken)({ sub: user.id });
        clearFailedLogins(ip);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/oauth-callback#access_token=${access}&refresh_token=${refresh}`);
    }
    catch (err) {
        trackFailedLogin(ip);
        res.status(500).json({ error: 'Dev login failed', details: err.message });
    }
});

router.get('/google', (_req, res) => {
    const base = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
        response_type: 'code',
        scope: 'openid email profile'
    });
    res.redirect(`${base}?${params.toString()}`);
});

router.get('/google/callback', async (req, res) => {
    const ip = getClientIp(req);
    if (isLockedOut(ip)) {
        return res.status(429).json({ error: 'Too many login failures. You are temporarily locked out.' });
    }
    const code = String(req.query.code || '');
    if (!code)
        return res.status(400).json({ error: 'Missing code' });
    try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID || '',
                client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
                grant_type: 'authorization_code'
            })
        });
        const tokenJson = await tokenRes.json();
        if (tokenJson.error) {
            logger_1.default.error('Google token error', { err: tokenJson });
            trackFailedLogin(ip);
            return res.status(400).json({ error: 'OAuth token exchange failed' });
        }
        const idToken = tokenJson.id_token;
        const infoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        const info = await infoRes.json();
        const email = info.email;
        if (!email) {
            trackFailedLogin(ip);
            return res.status(400).json({ error: 'Unable to verify Google user' });
        }
        let user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma_1.prisma.user.create({ data: { email, name: info.name || undefined, googleId: info.sub } });
        }
        // Sign tokens
        const access = (0, jwt_1.signAccessToken)({ sub: user.id, role: user.role });
        const refresh = (0, jwt_1.signRefreshToken)({ sub: user.id });
        await prisma_1.prisma.loginLog.create({ data: { userId: user.id, ip, device: req.headers['user-agent'] || 'unknown' } });
        clearFailedLogins(ip);
        const frontendUrl = process.env.FRONTEND_URL || 'https://program-learner.vercel.app';
        res.redirect(`${frontendUrl}/oauth-callback#access_token=${access}&refresh_token=${refresh}`);
    }
    catch (err) {
        logger_1.default.error('OAuth callback error', { error: err });
        trackFailedLogin(ip);
        res.status(500).json({ error: 'Internal error' });
    }
});

router.post('/refresh', async (req, res) => {
    try {
        const token = req.body.refresh_token || req.headers.authorization?.split(' ')[1];
        if (!token)
            return res.status(401).json({ error: 'No refresh token' });
        
        const data = (0, jwt_1.verifyRefreshToken)(token);
        
        // Token Reuse Detection
        if ((0, jwt_1.isTokenRevoked)(data.jti)) {
            logger_1.default.error('Security alert: Refresh token reuse detected!', { jti: data.jti, userId: data.sub });
            // Try to log the security event
            try {
                await prisma_1.prisma.activityLog.create({
                    data: {
                        userId: data.sub,
                        action: 'REFRESH_TOKEN_REUSE_ATTEMPT',
                        meta: JSON.stringify({ jti: data.jti, ip: getClientIp(req) })
                    }
                });
            } catch (e) {}
            return res.status(401).json({ error: 'Token reuse detected. Access denied. Please log in again.' });
        }

        const user = await prisma_1.prisma.user.findUnique({ where: { id: data.sub } });
        if (!user)
            return res.status(401).json({ error: 'Invalid token user' });

        // Revoke the old token
        (0, jwt_1.revokeToken)(data.jti, data.exp);

        // Generate rotated tokens
        const access = (0, jwt_1.signAccessToken)({ sub: user.id, role: user.role });
        const refresh = (0, jwt_1.signRefreshToken)({ sub: user.id });
        
        res.json({ ok: true, access_token: access, refresh_token: refresh });
    }
    catch (err) {
        logger_1.default.warn('Refresh token failed', { err: err?.message });
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

router.post('/logout', (_req, res) => {
    res.json({ ok: true });
});

exports.default = router;
