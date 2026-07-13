const fs = require('fs');
const filePath = 'backend/dist/routes/admin.js';
let code = fs.readFileSync(filePath, 'utf8');

// Add PUT /courses/:id
const coursePut = `
// Edit course
router.put('/courses/:id', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, emoji } = req.body;
        const data = {};
        if (title !== undefined) data.title = title;
        if (emoji !== undefined) data.description = emoji;
        const course = await prisma_1.prisma.course.update({ where: { id }, data });
        res.json({ course });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update course' });
    }
});
`;

// Add PUT /tasks/:id
const taskPut = `
// Edit task
router.put('/tasks/:id', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, courseId, baseCode, testCases, xpReward, isChallenge, hint } = req.body;
        const data = {};
        if (title !== undefined) data.title = title;
        if (description !== undefined) data.description = description;
        if (courseId !== undefined) data.courseId = courseId;
        if (baseCode !== undefined) data.baseCode = baseCode;
        if (testCases !== undefined) data.testCases = JSON.stringify(testCases);
        if (xpReward !== undefined) data.xpReward = xpReward;
        if (isChallenge !== undefined) data.isChallenge = isChallenge;
        if (hint !== undefined) data.hint = hint;
        const task = await prisma_1.prisma.task.update({ where: { id }, data });
        if (task.testCases && typeof task.testCases === 'string') {
            try { task.testCases = JSON.parse(task.testCases); } catch(e){}
        }
        res.json({ task });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});
`;

code = code.replace('// Delete course (track)', coursePut + '\n// Delete course (track)');
code = code.replace('// Delete task', taskPut + '\n// Delete task');

fs.writeFileSync(filePath, code);
console.log('Done');
