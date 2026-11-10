# SchemaVault — Product Brief

**Product Name:** `schemavault` (CLI: `schemavault`)  
**Date:** 2026-11-10  
**Author:** Jatin Sharma ([https://jatinsh.netlify.app/](https://jatinsh.netlify.app/))  
**GitHub Repository:** `https://github.com/raghav1924/schemavault`  
**License:** MIT  

---

## 1. Executive Summary & Problem Discovery
In November 2026, modern full-stack web applications and micro-SaaS platforms heavily rely on **PostgreSQL, Supabase, and Prisma/Drizzle ORMs**.
However, managing and reviewing database schema changes introduces massive developer friction:
1. **Destructive Migration Blindspots:** Developers execute SQL migrations locally or in CI/CD without realizing that statements like `DROP COLUMN`, `ALTER TABLE ... TYPE`, or missing `NOT NULL` defaults will lock production tables or drop data.
2. **Missing Row Level Security (RLS) Auditing:** In Supabase, forgetting to enable RLS or creating overly permissive policies (`using (true)`) exposes sensitive tenant data to public PostgREST API queries.
3. **Complex Foreign Key ER Graph Mental Models:** Reviewing raw SQL migrations in pull requests does not communicate how tables, foreign keys, and indexes connect.
4. **Heavy Enterprise Bloat:** Existing tools (Bytebase, DbSchema) are heavyweight enterprise SaaS or Java-based desktop GUIs that cannot run as lightweight zero-dependency CLI pre-commit linters.

---

## 2. Product Solution: SchemaVault
**SchemaVault** is an ultra-fast, zero-dependency PostgreSQL & Supabase Schema Linter, Destructive Change Detector, ER Diagram Synthesizer & Visual Migration Studio.

### Core Capabilities:
- ⚡ **Zero-Dependency SQL DDL Parser:** Parses standard Postgres `CREATE TABLE`, `ALTER TABLE`, `DROP`, `ADD CONSTRAINT`, `CREATE INDEX`, and `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements directly from local migration directories (`supabase/migrations`, `prisma/migrations`, or raw `.sql` files).
- 🚨 **Destructive Change Linter (Safety Gate):**
  - `RULE-01`: Flags `DROP TABLE` or `DROP COLUMN` as breaking data loss hazards.
  - `RULE-02`: Flags `ALTER COLUMN TYPE` without safe casting.
  - `RULE-03`: Flags `NOT NULL` added to existing columns without a `DEFAULT` clause (blocks table locks).
  - `RULE-04`: Flags unindexed Foreign Key columns (prevents cascading scan performance bottlenecks).
  - `RULE-05`: **Supabase RLS Audit**: Flags any table that fails to enable `ROW LEVEL SECURITY` or lacks authenticated policy guards.
- 📐 **Instant Mermaid.js ER Diagram Synthesis:** Compiles schema tables, column types, primary keys, and foreign-key arrows into GitHub README-ready Mermaid ERDs (`erDiagram`).
- 🌐 **Interactive Dark-Mode Visual Studio (`--web`):** Built-in local HTTP server (`http://localhost:4880`) providing:
  - Interactive visual schema graph and table explorer
  - Migration safety score (0-100%) and risk rating
  - Column data type inspection (UUID, Timestamps, JSONB, FK links)
  - Interactive SQL sandbox & migration diff preview
- 📄 **Standalone Single-File HTML Export (`--export`):** Generates self-contained schema documentation for pull requests and audits.
- 🚀 **CI/CD Quality Gate:** Native flags (`--max-risk high`, `--min-score 85`) to fail GitHub Actions before unsafe migrations hit production.

---

## 3. Tech Stack & Architecture
- **Language:** TypeScript 5.9 (Strict mode)
- **Runtime:** Node.js (>=18.0.0, zero external production dependencies)
- **Diagramming:** Native Mermaid.js Entity-Relationship model generation
- **Design System:** Dark-mode terminal typography + Responsive Web Studio (CSS Variables, Flexbox/Grid, high-contrast badges)
- **Testing:** Native Node.js test runner (`node:test`, `node:assert`)

