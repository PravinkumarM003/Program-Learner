"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const uploadDir = path_1.default.join(__dirname, '..', '..', 'uploads');
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!allowed.includes(file.mimetype))
            return cb(new Error('Unsupported file type'), false);
        cb(null, true);
    }
});
router.post('/tasks/:taskId', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN'), upload.single('file'), async (req, res) => {
    const taskId = String(req.params.taskId);
    const file = req.file;
    if (!file)
        return res.status(400).json({ error: 'Missing file' });
    const attachment = await prisma_1.prisma.attachment.create({
        data: {
            filename: file.originalname,
            mime: file.mimetype,
            url: `/uploads/${path_1.default.basename(file.path)}`,
            size: file.size,
            kind: 'TASK_REFERENCE',
            taskId
        }
    });
    res.status(201).json({ attachment });
});
exports.default = router;
