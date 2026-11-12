# Changelog

All notable changes to **SchemaVault** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-10

### Added
- Zero-dependency SQL DDL parser extracting `CREATE TABLE`, `ALTER TABLE`, primary keys, foreign keys, and indexes.
- Supabase Row Level Security (RLS) auditing (`RLS-001`, `RLS-002`) detecting un-jailed public tables.
- Destructive change detection (`DATA-001`, `DATA-002`) identifying accidental table/column drops.
- Performance optimization rule (`PERF-001`) flagging missing indexes on foreign key columns.
- Automatic Mermaid.js ER diagram generation (`erDiagram`) for markdown documentation.
- Embedded dark-mode Migration Studio on `http://localhost:4880` with visual ER canvas and remediation snippets.
- Standalone single-file HTML report export (`--export schema-audit.html`).
- Automated CI/CD gates (`--fail-on critical`, `--min-score 85`).

