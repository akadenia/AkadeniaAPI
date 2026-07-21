# Security Policy

## Supported Versions

AkadeniaAPI follows semantic versioning. Security updates are provided for the current major version line.

| Version | Supported          |
| ------- | ------------------ |
| 1.6.x   | :white_check_mark: |
| 1.5.x   | :white_check_mark: |
| < 1.5   | :x:                |

Only the two most recent minor versions within the current major version receive security patches. Users are encouraged to upgrade to the latest release.

## Reporting a Vulnerability

We take security issues seriously. If you discover a vulnerability in AkadeniaAPI, please report it responsibly.

**Where to report:**
- GitHub Security Advisories: [Open a private advisory](https://github.com/akadenia/AkadeniaAPI/security/advisories/new)
- Or email: `security@akadenia.com`

**What to include:**
- A description of the vulnerability and its impact
- Steps to reproduce (proof of concept, if possible)
- Affected versions
- Any suggested remediation

**What to expect:**
- **Acknowledgment** within 2 business days
- **Initial assessment** within 5 business days
- **Patch timeline** communicated after triage (typically within 14 days for critical issues, 30 days for moderate)
- **Public disclosure** coordinated after a fix is released

We follow responsible disclosure. If the vulnerability is accepted, we will work with you to coordinate disclosure after a patch is available. If declined, we will explain our reasoning.

## Security Best Practices

When using AkadeniaAPI in production:
- Keep the package updated to the latest supported version
- Pin dependencies in your lockfile (`pnpm-lock.yaml`, `package-lock.json`, etc.)
- Review the package's dependency tree regularly (`pnpm audit`)
- Use the latest Node.js LTS release
