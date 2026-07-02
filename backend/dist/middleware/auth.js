"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
exports.authorizeRoles = authorizeRoles;
const jwt_1 = require("../utils/jwt");
function authenticateJWT(req, res, next) {
    const token = req.cookies?.access_token;
    if (!token)
        return res.status(401).json({ error: 'Authentication required' });
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload;
        return next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
function authorizeRoles(...allowed) {
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role || !allowed.includes(role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}
