import fs from 'node:fs';
import path from 'node:path';
import { RiskLevel, SchemaAnalysisReport, SchemaLinterFinding } from './types.js';
import { SqlParser } from './parser.js';
import { ALL_LINTER_RULES } from '../linter/rules.js';
import { MermaidErGenerator } from './mermaid.js';

export class SchemaEngine {
  public static analyzePath(targetPath: string): SchemaAnalysisReport {
    const sqlFiles = this.collectSqlFiles(targetPath);
    let combinedSql = '';

    for (const f of sqlFiles) {
      combinedSql += fs.readFileSync(f, 'utf-8') + '\n;';
    }

    const tables = SqlParser.parseSqlContent(combinedSql);
    const findings: SchemaLinterFinding[] = [];

    // Run Table-level rules
    for (const rule of ALL_LINTER_RULES) {
      if (rule.auditTables) {
        findings.push(...rule.auditTables(tables));
      }
      if (rule.auditSqlStatements) {
        findings.push(...rule.auditSqlStatements(combinedSql));
      }
    }

    // Tally risk summary
    const riskSummary: Record<RiskLevel, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    for (const f of findings) {
      riskSummary[f.risk] = (riskSummary[f.risk] || 0) + 1;
    }

    // Safety Score (0 - 100)
    // Deductions: Critical (-25), High (-15), Medium (-5), Low (-2)
    const deductions =
      riskSummary.CRITICAL * 25 +
      riskSummary.HIGH * 15 +
      riskSummary.MEDIUM * 5 +
      riskSummary.LOW * 2;

    const safetyScore = Math.max(0, 100 - deductions);

    let totalColumns = 0;
    for (const t of Object.values(tables)) {
      totalColumns += Object.keys(t.columns).length;
    }

    const mermaidErDiagram = MermaidErGenerator.generate(tables);

    return {
      timestamp: new Date().toISOString(),
      targetPath,
      totalTables: Object.keys(tables).length,
      totalColumns,
      tables,
      findings,
      safetyScore,
      riskSummary,
      mermaidErDiagram,
    };
  }

  private static collectSqlFiles(targetPath: string): string[] {
    const files: string[] = [];
    if (!fs.existsSync(targetPath)) return files;

    const stat = fs.statSync(targetPath);
    if (stat.isFile()) {
      if (targetPath.endsWith('.sql')) files.push(targetPath);
      return files;
    }

    // Recursive directory walk
    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'dist'].includes(entry.name)) {
            walk(full);
          }
        } else if (entry.isFile() && entry.name.endsWith('.sql')) {
          files.push(full);
        }
      }
    };

    walk(targetPath);
    return files;
  }
}
