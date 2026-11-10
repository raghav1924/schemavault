import { SchemaLinterFinding, TableDefinition } from '../core/types.js';

export interface LinterRule {
  code: string;
  name: string;
  auditTables?: (tables: Record<string, TableDefinition>) => SchemaLinterFinding[];
  auditSqlStatements?: (rawSql: string) => SchemaLinterFinding[];
}

// RULE-01: Supabase Missing Row Level Security (RLS)
export const RuleMissingRls: LinterRule = {
  code: 'RLS-001',
  name: 'Table Missing Row Level Security',
  auditTables: (tables) => {
    const findings: SchemaLinterFinding[] = [];
    for (const [tableName, table] of Object.entries(tables)) {
      if (!table.rlsEnabled) {
        findings.push({
          code: 'RLS-001',
          title: `Table '${tableName}' Lacks Row Level Security (RLS)`,
          risk: 'CRITICAL',
          tableName,
          description: `PostgreSQL table has no Row Level Security enabled. When exposed via Supabase or PostgREST, all records are publicly queryable/mutable.`,
          remediation: `Add statement: ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY; and define authenticated policies.`,
          sqlSnippet: `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`,
        });
      } else if (table.policies.length === 0) {
        findings.push({
          code: 'RLS-002',
          title: `RLS Enabled on '${tableName}' but No Policies Defined`,
          risk: 'HIGH',
          tableName,
          description: `RLS is enabled on table '${tableName}', but no access policies (CREATE POLICY) exist. All non-superuser client requests will be blocked by default.`,
          remediation: `Create explicit SELECT/INSERT/UPDATE policies with 'CREATE POLICY ... ON ${tableName}'.`,
          sqlSnippet: `CREATE POLICY "Allow authenticated read" ON ${tableName} FOR SELECT TO authenticated USING (true);`,
        });
      }
    }
    return findings;
  },
};

// RULE-02: Missing Primary Key
export const RuleMissingPrimaryKey: LinterRule = {
  code: 'PK-001',
  name: 'Table Missing Primary Key',
  auditTables: (tables) => {
    const findings: SchemaLinterFinding[] = [];
    for (const [tableName, table] of Object.entries(tables)) {
      if (table.primaryKeys.length === 0) {
        findings.push({
          code: 'PK-001',
          title: `Table '${tableName}' Has No Primary Key`,
          risk: 'HIGH',
          tableName,
          description: `Table lacks a defined primary key constraint, impairing replication, indexing, and object-relational mapping.`,
          remediation: `Add a primary key constraint, e.g. id uuid DEFAULT gen_random_uuid() PRIMARY KEY.`,
          sqlSnippet: `ALTER TABLE ${tableName} ADD PRIMARY KEY (id);`,
        });
      }
    }
    return findings;
  },
};

// RULE-03: Unindexed Foreign Key
export const RuleUnindexedForeignKey: LinterRule = {
  code: 'PERF-001',
  name: 'Unindexed Foreign Key Column',
  auditTables: (tables) => {
    const findings: SchemaLinterFinding[] = [];
    for (const [tableName, table] of Object.entries(tables)) {
      for (const [colName, col] of Object.entries(table.columns)) {
        if (col.references) {
          const isIndexed = table.indexes.some(idx => idx.includes(colName));
          if (!isIndexed) {
            findings.push({
              code: 'PERF-001',
              title: `Foreign Key '${tableName}.${colName}' Lacks Index`,
              risk: 'MEDIUM',
              tableName,
              columnName: colName,
              description: `Foreign key reference '${col.references.table}.${col.references.column}' has no corresponding index on table '${tableName}'. This leads to full table scans on cascading updates or deletes.`,
              remediation: `Create an index: CREATE INDEX idx_${tableName}_${colName} ON ${tableName}(${colName});`,
              sqlSnippet: `CREATE INDEX idx_${tableName}_${colName} ON ${tableName}(${colName});`,
            });
          }
        }
      }
    }
    return findings;
  },
};

// RULE-04: Destructive Changes in Migration SQL (DROP COLUMN, DROP TABLE)
export const RuleDestructiveChanges: LinterRule = {
  code: 'DATA-001',
  name: 'Destructive DDL Operation Detected',
  auditSqlStatements: (rawSql) => {
    const findings: SchemaLinterFinding[] = [];

    // Check for DROP TABLE
    const dropTableMatches = rawSql.matchAll(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_]+)/gi);
    for (const match of dropTableMatches) {
      findings.push({
        code: 'DATA-001',
        title: `Destructive 'DROP TABLE ${match[1]}' Statement`,
        risk: 'CRITICAL',
        tableName: match[1],
        description: `Migration contains a direct DROP TABLE statement, resulting in irrecoverable data loss and downtime.`,
        remediation: `Archive or rename the table instead of dropping it immediately, or execute deprecation phases.`,
        sqlSnippet: match[0],
      });
    }

    // Check for DROP COLUMN
    const dropColMatches = rawSql.matchAll(/ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+DROP\s+COLUMN\s+([a-zA-Z0-9_]+)/gi);
    for (const match of dropColMatches) {
      findings.push({
        code: 'DATA-002',
        title: `Destructive 'DROP COLUMN ${match[2]}' on Table '${match[1]}'`,
        risk: 'HIGH',
        tableName: match[1],
        columnName: match[2],
        description: `Dropping a column immediately breaks active client queries and destroys historical data.`,
        remediation: `Deprecate the column in application code first, then remove it in a subsequent scheduled migration.`,
        sqlSnippet: match[0],
      });
    }

    return findings;
  },
};

export const ALL_LINTER_RULES: LinterRule[] = [
  RuleMissingRls,
  RuleMissingPrimaryKey,
  RuleUnindexedForeignKey,
  RuleDestructiveChanges,
];

