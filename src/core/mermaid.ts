import { TableDefinition } from './types.js';

export class MermaidErGenerator {
  public static generate(tables: Record<string, TableDefinition>): string {
    const lines: string[] = ['erDiagram'];

    // 1. Tables & Columns
    for (const [tableName, table] of Object.entries(tables)) {
      lines.push(`    ${tableName} {`);
      for (const [colName, col] of Object.entries(table.columns)) {
        const pkMarker = col.isPrimaryKey ? 'PK' : col.references ? 'FK' : '';
        const safeType = col.type.replace(/[^a-zA-Z0-9_]/g, '');
        lines.push(`        ${safeType} ${colName} ${pkMarker}`);
      }
      lines.push(`    }`);
    }

    // 2. Relationships (Foreign keys)
    for (const [tableName, table] of Object.entries(tables)) {
      for (const col of Object.values(table.columns)) {
        if (col.references && tables[col.references.table]) {
          // Syntax: table1 ||--o{ table2 : "references"
          lines.push(`    ${col.references.table} ||--o{ ${tableName} : "${col.name}"`);
        }
      }
    }

    return lines.join('\n');
  }
}
