"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma_1 = require("./prisma");

async function seedAchievements() {
    const achievements = [
        { id: 'achievement-first-sub', title: 'First Steps', description: 'Submitted your first task.', icon: '👶', criteria: 'first_submission', xpReward: 25 },
        { id: 'achievement-five-subs', title: 'Code Warrior', description: 'Submitted 5 tasks.', icon: '🦉', criteria: 'five_submissions', xpReward: 50 },
        { id: 'achievement-ten-accepted', title: 'Master Coder', description: 'Got 10 accepted submissions.', icon: '✨', criteria: 'ten_accepted', xpReward: 100 },
        { id: 'achievement-lesson-5', title: 'Aspiring Scholar', description: 'Completed 5 lessons.', icon: '🎯', criteria: 'lesson_5', xpReward: 50 },
        { id: 'achievement-lesson-10', title: 'Polymath', description: 'Completed 10 lessons.', icon: '🔥', criteria: 'lesson_10', xpReward: 100 },
        { id: 'achievement-xp-100', title: 'XP Collector', description: 'Earned at least 100 XP.', icon: '💬', criteria: 'xp_100', xpReward: 25 },
        { id: 'achievement-xp-500', title: 'Elite Developer', description: 'Earned at least 500 XP.', icon: '🚀', criteria: 'xp_500', xpReward: 100 },
        { id: 'achievement-xp-1000', title: 'Grandmaster', description: 'Earned at least 1000 XP.', icon: '🏆', criteria: 'xp_1000', xpReward: 250 },
    ];
    for (const a of achievements) {
        try {
            await prisma_1.prisma.achievement.upsert({
                where: { id: a.id },
                update: {},
                create: a
            });
        } catch (e) {
            // Silence if DB is down or model is missing
        }
    }
}

const PORT = process.env.PORT || 4000;
seedAchievements().finally(() => {
    app_1.default.listen(PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`Server running on port ${PORT}`);
    });
});
