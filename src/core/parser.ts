import fs from 'node:fs';
import path from 'node:path';
import { ColumnDefinition, TableDefinition } from './types.js';

export class SqlParser {
  public static parseFiles(filePaths: string[]): Record<string, TableDefinition> {
    const tables: Record<string, TableDefinition> = {};

    for (const filePath of filePaths) {
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, 'utf-8');
      this.parseSqlContent(content, tables);
    }

    return tables;
  }

  public static parseSqlContent(sql: string, existingTables: Record<string, TableDefinition> = {}): Record<string, TableDefinition> {
    const tables = existingTables;

    // Clean comments: remove -- comments and /* */
    const cleanSql = sql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    // Split statements by semicolon
    const statements = cleanSql.split(';').map(s => s.trim()).filter(Boolean);

    for (const stmt of statements) {
      // 1. CREATE TABLE
      const createTableMatch = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s*\(([\s\S]*)\)/i);
      if (createTableMatch) {
        const schema = createTableMatch[1] || 'public';
        const tableName = createTableMatch[2];
        const body = createTableMatch[3];

        if (!tables[tableName]) {
          tables[tableName] = {
            name: tableName,
            schema,
            columns: {},
            primaryKeys: [],
            indexes: [],
            rlsEnabled: false,
            policies: [],
          };
        }

        this.parseColumns(body, tables[tableName]);
      }

      // 2. ALTER TABLE ... ENABLE ROW LEVEL SECURITY
      const rlsMatch = stmt.match(/ALTER\s+TABLE\s+(?:ONLY\s+)?(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
      if (rlsMatch) {
        const tableName = rlsMatch[2];
        if (tables[tableName]) {
          tables[tableName].rlsEnabled = true;
        }
      }

      // 3. CREATE POLICY
      const policyMatch = stmt.match(/CREATE\s+POLICY\s+["']?([^"'\s]+)["']?\s+ON\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)/i);
      if (policyMatch) {
        const policyName = policyMatch[1];
        const tableName = policyMatch[3];
        if (tables[tableName]) {
          tables[tableName].policies.push(policyName);
        }
      }

      // 4. CREATE INDEX
      const indexMatch = stmt.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+ON\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i);
      if (indexMatch) {
        const indexName = indexMatch[1];
        const tableName = indexMatch[3];
        const indexedCol = indexMatch[4].trim();
        if (tables[tableName]) {
          tables[tableName].indexes.push(indexedCol);
        }
      }
    }

    return tables;
  }

  private static parseColumns(body: string, table: TableDefinition): void {
    // Split by comma outside parentheses
    const lines = this.splitTopLevelCommas(body);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Table-level PRIMARY KEY (col1, col2)
      const pkMatch = line.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pkMatch) {
        const pks = pkMatch[1].split(',').map(s => s.trim().replace(/["']/g, ''));
        table.primaryKeys.push(...pks);
        pks.forEach(pk => {
          if (table.columns[pk]) table.columns[pk].isPrimaryKey = true;
        });
        continue;
      }

      // Table-level FOREIGN KEY
      const fkMatch = line.match(/^FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i);
      if (fkMatch) {
        const col = fkMatch[1].trim().replace(/["']/g, '');
        const refTable = fkMatch[3].trim();
        const refCol = fkMatch[4].trim().replace(/["']/g, '');
        if (table.columns[col]) {
          table.columns[col].references = { table: refTable, column: refCol };
        }
        continue;
      }

      // Standard Column Definition: "column_name TYPE constraints..."
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const colName = parts[0].replace(/["']/g, '');
        if (['CONSTRAINT', 'CHECK', 'UNIQUE'].includes(colName.toUpperCase())) continue;

        const colType = parts[1].toLowerCase();
        const upperLine = line.toUpperCase();

        const isPrimaryKey = upperLine.includes('PRIMARY KEY');
        const isNullable = !upperLine.includes('NOT NULL') && !isPrimaryKey;

        let defaultValue: string | undefined;
        const defaultMatch = line.match(/DEFAULT\s+([^,\s]+)/i);
        if (defaultMatch) defaultValue = defaultMatch[1];

        // Inline REFERENCES
        let references: ColumnDefinition['references'];
        const refMatch = line.match(/REFERENCES\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s*(?:\(([^)]+)\))?/i);
        if (refMatch) {
          references = {
            table: refMatch[2],
            column: refMatch[3] || 'id',
          };
        }

        if (isPrimaryKey) table.primaryKeys.push(colName);

        table.columns[colName] = {
          name: colName,
          type: colType,
          isNullable,
          isPrimaryKey,
          defaultValue,
          references,
        };
      }
    }
  }

  private static splitTopLevelCommas(str: string): string[] {
    const result: string[] = [];
    let current = '';
    let parenDepth = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;

      if (char === ',' && parenDepth === 0) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) result.push(current);
    return result;
  }
}

