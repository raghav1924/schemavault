# 🏛️ SchemaVault

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/raghav1924/schemavault/actions/workflows/ci.yml/badge.svg)](https://github.com/raghav1924/schemavault/actions)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-emerald.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-RLS-emerald.svg)](https://supabase.com/)

**Developer-first PostgreSQL & Supabase Schema Linter, Destructive Change Detector, ER Diagram Synthesizer & Visual Migration Studio.**

[Features](#-key-features) • [Quick Start](#-quick-start) • [Security & Safety Rules](#-linter-rules--safety-heuristics) • [Visual ER Studio](#-interactive-er-diagram-studio) • [CI/CD Gate](#-cicd-pipeline-integration)

</div>

---

## 💡 Why SchemaVault?

In modern web applications built on **PostgreSQL, Supabase, Prisma, or Drizzle**, database migrations directly dictate application uptime and security.

However, database migrations frequently introduce silent production disasters:
- **Missing Row Level Security (RLS):** In Supabase, forgetting `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` exposes multi-tenant data publicly via PostgREST.
- **Destructive Data Loss Operations:** Accidental `DROP TABLE` or `DROP COLUMN` statements pushed in PRs erase historical data and crash active client queries.
- **Unindexed Foreign Keys:** Missing indexes on foreign key columns cause catastrophic table-locking sequence scans during cascading updates or deletes.
- **Opaque ER Diagrams:** Reviewing multi-table migrations in pull requests without visual relationship graphs makes schema comprehension difficult.

**SchemaVault** runs 100% locally with **zero external dependencies**: it parses your SQL migration files, audits schemas against battle-tested CVE and performance rules, computes a composite **Schema Safety Score (0-100%)**, compiles GitHub-ready Mermaid ER diagrams, and launches an embedded dark-mode browser studio.

---

## ✨ Key Features

- ⚡ **Zero-Dependency SQL DDL Parser:** Parses standard Postgres `CREATE TABLE`, `ALTER TABLE`, `DROP`, `REFERENCES`, `INDEX`, and Supabase `RLS` policies directly from local files.
- 🚨 **Destructive Change Linter:** Flags accidental `DROP TABLE` or `DROP COLUMN` statements before they reach staging or production databases.
- 🛡️ **Supabase RLS & Policy Auditor:** Flags tables missing Row Level Security or configured with zero policies.
- 📐 **Automated Mermaid.js ERD Synthesis:** Generates clean `erDiagram` markdown charts with primary keys (PK), foreign keys (FK), and relationship arrows for your GitHub READMEs.
- 🌐 **Interactive Dark-Mode Visual Studio (`--web`):** Instant browser dashboard on `http://localhost:4880` featuring table inspection, ER diagram visualization, and remediation SQL snippets.
- 📄 **Single-File HTML Export (`--export`):** Generates standalone interactive audit reports for pull request attachments or team compliance reviews.
- 🚀 **CI/CD Quality Gate:** Native flags (`--min-score 85`, `--fail-on critical`) to block PRs from merging unsafe migrations.

---

## 🚀 Quick Start

### 1. Audit Migrations in the Terminal
\`\`\`bash
# Scan migrations in current directory or specific SQL folder
npx schemavault lint ./supabase/migrations

# Lint a standalone schema file
npx schemavault lint schema.sql
\`\`\`

### 2. Launch the Interactive Visual ER Studio
\`\`\`bash
# Opens browser studio on http://localhost:4880
npx schemavault visualize ./supabase/migrations
\`\`\`

---

## 🛡️ Linter Rules & Safety Heuristics

| Rule ID | Category | Risk | What It Detects |
|---|---|---|---|
| **`RLS-001`** | **Security** | `CRITICAL` | Table lacks Row Level Security (`ENABLE ROW LEVEL SECURITY`) in Supabase/PostgREST. |
| **`RLS-002`** | **Security** | `HIGH` | Table has RLS enabled but zero policies (`CREATE POLICY`) defined, locking out all requests. |
| **`DATA-001`** | **Data Safety** | `CRITICAL` | Destructive `DROP TABLE` statement detected in migration script. |
| **`DATA-002`** | **Data Safety** | `HIGH` | Destructive `DROP COLUMN` statement detected in migration script. |
| **`PK-001`** | **Integrity** | `HIGH` | Table created without a primary key constraint. |
| **`PERF-001`** | **Performance** | `MEDIUM` | Foreign key reference column lacks an index, causing cascading full table scans. |

---

## 🌐 Interactive ER Diagram Studio

Run SchemaVault with `--web` to launch the dark-mode browser studio:

\`\`\`bash
schemavault lint ./supabase/migrations --web
\`\`\`

Studio Highlights:
- High-contrast dark mode (Linear/Vercel design aesthetic).
- Live SVG Entity-Relationship rendering powered by Mermaid.js.
- Table list with real-time RLS status badges (`RLS ✔` vs `NO RLS ⚠`).
- Remediation SQL diff viewer with one-click copyable SQL statements.
- Direct portfolio backlink to [Jatin Sharma](https://jatinsh.netlify.app/).

---

## 🚢 CI/CD Pipeline Integration

Enforce schema quality gates in GitHub Actions before deploying:

\`\`\`bash
# Fail CI build if any CRITICAL hazard (e.g. missing RLS or DROP TABLE) is detected
schemavault lint ./migrations --fail-on critical

# Fail CI build if schema safety score falls below 85%
schemavault lint ./migrations --min-score 85

# Export Mermaid ER diagram directly into a documentation file
schemavault lint ./migrations --mermaid ./docs/schema.mmd
\`\`\`

### GitHub Actions Workflow Example
\`\`\`yaml
name: Database Schema Safety Gate
on: [push, pull_request]

jobs:
  schema-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Verify Schema Safety
        run: npx schemavault lint ./supabase/migrations --fail-on critical --min-score 85
\`\`\`

---

## 🛠 CLI Options & Flags

\`\`\`bash
schemavault <command> [directory/file] [options]

Commands:
  lint, scan [path]       Lint PostgreSQL/Supabase schema for safety hazards (default: '.')
  visualize, studio [path] Launch interactive browser ER Diagram studio
  help                    Show help documentation

Flags:
  --web                   Start interactive browser Studio after analysis
  --export <file.html>    Save static standalone HTML schema dashboard
  --mermaid <file.mmd>    Save raw Mermaid.js ER diagram
  --json                  Output machine-readable JSON for CI/CD
  --min-score <score>     Fail process if safety score is below score (0-100)
  --fail-on <severity>    Exit with code 1 on 'critical' or 'high' findings
\`\`\`

---

## 👨‍💻 Author & Open Source

Created with ❤️ by **[Jatin Sharma](https://jatinsh.netlify.app/)**  
*Full-Stack Engineer & Product Designer*

- 🌐 **Portfolio & Case Studies:** [https://jatinsh.netlify.app/](https://jatinsh.netlify.app/)
- 🐙 **GitHub:** [@raghav1924](https://github.com/raghav1924)
- 📦 **Repository:** [https://github.com/raghav1924/schemavault](https://github.com/raghav1924/schemavault)

Distributed under the [MIT License](LICENSE).

