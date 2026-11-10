import test from 'node:test';
import assert from 'node:assert';
import { SqlParser } from '../core/parser.js';
import { SchemaEngine } from '../core/engine.js';
import { RuleMissingRls, RuleDestructiveChanges } from '../linter/rules.js';

test('SqlParser extracts tables, columns, primary keys, and foreign keys', () => {
  const sql = `
    CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL,
      created_at timestamp with time zone DEFAULT now()
    );

    CREATE TABLE posts (
      id serial PRIMARY KEY,
      author_id uuid REFERENCES users(id),
      title text NOT NULL,
      content text
    );
  `;

  const tables = SqlParser.parseSqlContent(sql);
  assert.ok(tables['users'], 'users table extracted');
  assert.ok(tables['posts'], 'posts table extracted');
  assert.strictEqual(tables['users'].columns['id'].isPrimaryKey, true);
  assert.strictEqual(tables['posts'].columns['author_id'].references?.table, 'users');
});

test('RuleMissingRls flags tables without Row Level Security', () => {
  const sql = `
    CREATE TABLE sensitive_data (
      id uuid PRIMARY KEY,
      secret_token text
    );
  `;
  const tables = SqlParser.parseSqlContent(sql);
  const findings = RuleMissingRls.auditTables!(tables);

  assert.ok(findings.some(f => f.code === 'RLS-001'), 'Flags missing RLS');
});

test('RuleDestructiveChanges flags DROP COLUMN and DROP TABLE statements', () => {
  const migration = `
    ALTER TABLE users DROP COLUMN legacy_field;
    DROP TABLE old_analytics;
  `;
  const findings = RuleDestructiveChanges.auditSqlStatements!(migration);

  assert.ok(findings.some(f => f.code === 'DATA-001'), 'Flags DROP TABLE');
  assert.ok(findings.some(f => f.code === 'DATA-002'), 'Flags DROP COLUMN');
});
