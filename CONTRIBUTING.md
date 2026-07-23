# Contributing to EduPilot AI

Thank you for considering a contribution to EduPilot AI. This document explains the process for contributing code, documentation, and bug reports.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Branch Naming](#branch-naming)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)

---

## Code of Conduct

All contributors must follow the [Code of Conduct](CODE_OF_CONDUCT.md). Respectful, constructive communication is expected in all project spaces.

---

## Ways to Contribute

- **Bug reports** — Open an issue with a clear description and reproduction steps
- **Feature requests** — Open an issue with the label `enhancement`
- **Code contributions** — Fork, branch, code, test, and open a pull request
- **Documentation** — Improve the README, inline comments, or API docs
- **Security** — See [SECURITY.md](SECURITY.md) for the responsible disclosure process

---

## Development Setup

### Prerequisites

- Node.js 20 LTS or later
- An OpenRouter API key (free tier available at [openrouter.ai](https://openrouter.ai))
- MySQL 8 (optional)

### Steps

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/EduPilot-AI.git
cd EduPilot-AI

# 2. Install backend dependencies
cd backend && npm install

# 3. Configure your local environment
cp .env.example .env
# Add OPENROUTER_API_KEY to .env

# 4. Start the development server (auto-restarts on changes)
npm run dev
```

Open `http://localhost:5000` in your browser to verify everything works.

---

## Branch Naming

Use the following prefixes:

| Prefix | Purpose |
|---|---|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `docs/` | Documentation only |
| `refactor/` | Code restructuring without behaviour change |
| `test/` | Adding or fixing tests |
| `chore/` | Build system, CI, dependencies |

**Examples:**

```bash
feat/streaming-responses
fix/voice-input-permission-error
docs/improve-api-reference
```

---

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short description>

<optional body>

<optional footer>
```

**Examples:**

```
feat(api): add POST /chat streaming response endpoint
fix(voice): handle mic permission denied on iOS Safari
docs(readme): update model switching instructions
refactor(openrouter): remove redundant inline model fallback
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

---

## Pull Request Process

1. Open your PR against the `main` branch
2. Fill in the PR template completely
3. Ensure your branch is up to date with `main` before requesting review
4. All CI checks must pass
5. At least one maintainer approval is required before merging
6. Squash and merge is the preferred merge strategy

---

## Coding Standards

### JavaScript / Node.js

- ES Modules (`import`/`export`) — CommonJS (`require`) is not used
- `async/await` over raw Promises
- Named exports preferred over default exports (except for the Express `app`)
- Errors are always propagated via `next(error)` in controllers — never swallowed

### Frontend

- Vanilla JS only — no build tools, no bundlers
- All AI output rendered via `DOMPurify.sanitize(marked.parse(...))` — never raw `.innerHTML`
- No inline event handlers in HTML — all listeners attached in `script.js`

### Environment Variables

- All env vars are read and validated in `backend/src/config/env.js` — never read directly from `process.env` in controllers or services
- Every new environment variable must be documented in `.env.example`

---

Thank you for helping make EduPilot AI better.
