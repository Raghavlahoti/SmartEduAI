# Changelog

All notable changes to EduPilot AI are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Planned
- JWT authentication with user accounts
- SSE streaming responses
- Tavily/Brave Search integration for live web search
- Server-side conversation history (MySQL)

---

## [1.3.0] — 2026-07-23

### Added
- `OPENROUTER_MODEL` environment variable for zero-code model switching
- Startup validation that logs the active model and throws on empty model name
- `searchService.js` — real-time query detection with pluggable web search stub
- Anti-hallucination system prompt directives across all persona modes
- `render.yaml` for one-click Render deployment
- `vercel.json` for Vercel frontend deployment
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`
- GitHub Actions CI workflow (`.github/workflows/ci.yml`)
- `docs/screenshots/` folder for screenshot documentation

### Changed
- Default fallback model changed to `openrouter/free`
- `validateEnv()` now throws `Error` when `OPENROUTER_MODEL` is an empty string
- Removed redundant inline model fallback from `openRouterService.js` (single source of truth in `config`)
- Premium README rewritten with architecture diagram, API docs, and deployment guide

### Fixed
- Voice input (Web Speech API) lifecycle implemented correctly with `onstart`, `onresult`, `onerror`, `onend`
- Browser microphone permission denial now shows a user-friendly alert

---

## [1.2.0] — 2026-07-23

### Added
- Clean 2-column responsive layout (removed static right sidebar)
- Responsive mobile sidebar drawer with overlay
- Voice status toast notification with animated pulse dot
- PDF.js client-side PDF text extraction
- Tesseract.js client-side image OCR
- Prompt Templates modal (Student / Teacher / Developer)
- Export chat as Markdown
- Copy code block buttons on AI responses
- Like / Dislike reaction buttons on bot messages
- Stop generation button (AbortController)

### Removed
- Hardcoded user profile card ("Raghav Maheshwari")
- Hardcoded right sidebar telemetry (static token count, timestamps)
- Theme toggle button

---

## [1.1.0] — 2026-07-23

### Added
- Modular production backend (`backend/src/`) with separate config, controllers, middleware, services, utils
- Winston structured logging (JSON in production, colourised in development)
- Helmet security headers
- Gzip compression
- express-rate-limit (100 req / 15 min per IP)
- Global error handler middleware
- MySQL connection pool with auto-table creation
- Docker & Docker Compose support
- `DEPLOYMENT.md`

---

## [1.0.0] — 2026-07-23

### Added
- Initial EduPilot AI application
- OpenRouter API integration
- Student / Teacher / Developer persona modes
- Basic chat interface
- Session management with LocalStorage
- Markdown rendering via marked.js + DOMPurify
