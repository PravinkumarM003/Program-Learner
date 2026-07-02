"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.revokeToken = revokeToken;
exports.isTokenRevoked = isTokenRevoked;

const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();

const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '30d';

const revokedTokens = new Map();

function revokeToken(jti, exp) {
    if (jti) {
        revokedTokens.set(jti, exp * 1000); // exp is in seconds
    }
}

function isTokenRevoked(jti) {
    if (!jti) return false;
    const exp = revokedTokens.get(jti);
    if (!exp) return false;
    if (Date.now() > exp) {
        revokedTokens.delete(jti);
        return false;
    }
    return true;
}

// Prune expired tokens every 30 minutes
setInterval(() => {
    const now = Date.now();
    for (const [jti, exp] of revokedTokens.entries()) {
        if (now > exp) {
            revokedTokens.delete(jti);
        }
    }
}, 30 * 60 * 1000).unref();

function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_ACCESS_SECRET || 'access_secret', { expiresIn: ACCESS_EXPIRES });
}

function signRefreshToken(payload) {
    const jti = Math.random().toString(36).substring(7) + Date.now();
    return jsonwebtoken_1.default.sign({ ...payload, jti }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', { expiresIn: REFRESH_EXPIRES });
}

function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET || 'access_secret');
}

function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
}
