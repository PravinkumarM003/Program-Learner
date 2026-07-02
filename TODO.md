# PyLearn Secure - Implementation TODO

- [x] 1) Database: update `backend/prisma/schema.prisma` to include all required tables/fields (roles, notifications, comments, leaderboard, etc.) with UUID PKs, relations, constraints, indexes.

- [ ] 2) Backend: add hardened security layer (CSRF, CSP, request validation via Zod, sanitization, better rate limiting, audit logging scaffolding).
- [ ] 3) Backend Auth: implement refresh-token rotation with revocation storage; ensure access/refresh cookies + CSRF for mutations; add login attempt tracking + lockout.
- [ ] 4) Backend API: implement missing REST routes (lessons, progress, task CRUD, admin review/grade, analytics, leaderboard, exports, attachments upload).
- [ ] 5) Sandbox/Executor: implement safe submission execution strategy (rule-based verifier now; Docker-isolated runner as optional service).
- [ ] 6) Frontend: implement React Router pages (Landing/Login/Student/Admin/Dashboard/Lessons/Tasks/Submission/Analytics/Settings).
- [ ] 7) Frontend Auth Flow: OAuth login redirect handling + token refresh handling using HTTP-only cookies.
- [ ] 8) Frontend Learning Module: lesson UI with quizzes (prediction + debugging), exercises, XP, progress persistence.
- [ ] 9) Frontend Task/Submission: Monaco editor with autosave/drafts, submission version history, status UI.
- [ ] 10) Admin Dashboard: review submissions, feedback, approve/reject, analytics charts + exports.
- [ ] 11) PWA: add manifest/service worker with offline caching + install prompt.
- [ ] 12) DevOps: update Dockerfiles (multi-stage), docker-compose services (Nginx + backend + frontend + db), secure Nginx config.
- [ ] 13) CI/CD: add GitHub Actions workflow for lint/test/build/deploy.
- [ ] 14) Documentation: write complete README (env vars, setup, migrations, OAuth setup, Docker & deployment, troubleshooting).
- [ ] 15) Verify: run `docker-compose up --build`, Prisma migrate, and validate auth→learning→task→submission→review flows.

