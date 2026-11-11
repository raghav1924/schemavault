# Contributing to SchemaVault

Thank you for your interest in contributing to **SchemaVault**! We welcome community contributions to help developers catch destructive migrations, unindexed foreign keys, and missing Supabase RLS policies before deploying to production.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/raghav1924/schemavault.git
   cd schemavault
   ```

2. **Compile TypeScript:**
   ```bash
   npm run build
   # or watch mode
   npm run dev
   ```

3. **Run Unit Tests:**
   ```bash
   npm test
   ```

## Pull Request Guidelines

- Ensure all existing and new unit tests pass (`npm test`).
- Keep changes zero-dependency: utilize Node.js standard libraries (`node:fs`, `node:path`, `node:http`).
- Write meaningful, conventional commit messages (`feat:`, `fix:`, `docs:`, `test:`).
- Document new SQL linter heuristics in `README.md`.

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful and constructive in all discussions and reviews.

---
Maintained by **[Jatin Sharma](https://jatinsh.netlify.app/)** • GitHub: **[@raghav1924](https://github.com/raghav1924)**
