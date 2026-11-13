# SchemaVault Architecture & SQL Static Analysis

This document details the SQL AST DDL parser, PostgreSQL schema modeler, and Supabase RLS security audit engine of **SchemaVault**.

Author: [Jatin Sharma](https://jatinsh.netlify.app/) (`@raghav1924`)

---

## Architectural Pipeline

```
Raw PostgreSQL / Supabase SQL DDL Files
                 │
                 ▼
       [ SQL Lexer & AST Parser ]
       - CREATE TABLE / ALTER TABLE / DROP TABLE
       - Column types, Constraints (PK, FK, UNIQUE, NOT NULL)
       - Row Level Security (ENABLE ROW LEVEL SECURITY, CREATE POLICY)
                 │
                 ├────────────────────────┬────────────────────────┐
                 ▼                        ▼                        ▼
      [ Destructive Detector ]     [ Security Auditor ]     [ ERD Synthesizer ]
      - DROP COLUMN/TABLE          - Supabase RLS policies  - Mermaid erDiagram
      - Table rewrite locks        - Unindexed FK indexes   - Relationship cardinality
                 │                        │                        │
                 └────────────────────────┴────────────────────────┘
                                          │
                                          ▼
                           [ Visual Migration Studio ]
                           (Embedded Web Studio :5050)
```

---

## 1. DDL Tokenizer & Grammar Parser (`src/core/parser.ts`)

- Parses standard Postgres DDL dialects without external C-bindings or native pg binaries.
- Accurately tracks foreign key constraints across tables and synthesizes a relational graph for Mermaid ER diagram rendering.

---

## 2. DevSecOps Migration Safety

SchemaVault flags migrations that:
- Execute `DROP TABLE` or `DROP COLUMN` without safe deprecation windows.
- Create foreign keys without companion indexes on the referencing table, causing full-table sequential scans during JOINs and CASCADE operations.
- Create public Supabase tables without enabling Row Level Security (RLS).

