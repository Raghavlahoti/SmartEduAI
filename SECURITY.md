# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest (`main`) | ✅ Yes |
| Older releases | ❌ No |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in EduPilot AI, please report it responsibly:

1. **Email:** Open a private GitHub security advisory at `https://github.com/Raghavlahoti/EduPilot-AI/security/advisories/new`
2. **Or:** Contact the maintainer directly via GitHub profile

### What to Include

Please provide as much of the following as possible:

- Type of issue (e.g. SQL injection, XSS, exposed secret, broken authentication)
- File path(s) and line numbers of the vulnerable source code
- Configuration required to reproduce the issue
- Step-by-step instructions to reproduce
- Proof-of-concept or exploit code (if available)
- Impact assessment — what an attacker could do

### Response Timeline

- **Acknowledgement:** Within 48 hours
- **Assessment:** Within 7 days
- **Fix:** Patches are prioritised based on severity (CVSS score)

## Security Design

### Implemented Controls

| Control | Implementation |
|---|---|
| HTTP Security Headers | Helmet.js |
| Rate Limiting | express-rate-limit (100 req / 15 min per IP) |
| Request Body Size Cap | 1 MB limit via express.json |
| Prompt Length Cap | 20,000 characters enforced in middleware |
| XSS Prevention | DOMPurify sanitises all AI output before DOM insertion |
| Secret Management | Secrets in `.env` only — never committed to git |
| Production Error Masking | Stack traces hidden in `NODE_ENV=production` |

### Known Limitations

- **CORS is set to `origin: "*"`** — acceptable for a publicly accessible educational tool; tighten this if you add authentication
- **No authentication layer** — the `/chat` endpoint is public; add JWT or session-based auth for multi-tenant deployments
- **Client-side session storage** — chat history is stored in LocalStorage; no server-side session isolation

## Dependency Security

Run `npm audit` regularly:

```bash
cd backend && npm audit
```

Critical and high severity vulnerabilities are resolved on a best-effort basis within 30 days.
