import { RiskLevel, SchemaAnalysisReport } from '../core/types.js';
import { colors } from '../utils/logger.js';

export class TerminalReporter {
  public static render(report: SchemaAnalysisReport): void {
    console.log(`\n${colors.bold}📋 PostgreSQL & Supabase Schema Audit Report${colors.reset}`);
    console.log(`${colors.gray}Path: ${report.targetPath} • ${report.timestamp}${colors.reset}\n`);

    const scoreColor = report.safetyScore >= 80 ? colors.green : report.safetyScore >= 60 ? colors.yellow : colors.red;
    const ratingBadge =
      report.safetyScore >= 85
        ? `${colors.bgGreen} PRODUCTION READY ${colors.reset}`
        : report.safetyScore >= 60
        ? `${colors.bgYellow} ATTENTION REQUIRED ${colors.reset}`
        : `${colors.bgRed} HIGH RISK MIGRATION ${colors.reset}`;

    console.log(`  Schema Safety Score:  ${scoreColor}${colors.bold}${report.safetyScore}/100${colors.reset}  ${ratingBadge}`);
    console.log(`  Discovered Tables:    ${colors.bold}${report.totalTables}${colors.reset}`);
    console.log(`  Total Columns:        ${colors.bold}${report.totalColumns}${colors.reset}`);
    console.log(`  Total Linter Issues:  ${report.findings.length > 0 ? colors.red + colors.bold : colors.green}${report.findings.length}${colors.reset}\n`);

    console.log(`${colors.bold}Risk Breakdown:${colors.reset}`);
    console.log(`  ${colors.red}${colors.bold}Critical:${colors.reset} ${report.riskSummary.CRITICAL}`);
    console.log(`  ${colors.magenta}${colors.bold}High:${colors.reset}     ${report.riskSummary.HIGH}`);
    console.log(`  ${colors.yellow}${colors.bold}Medium:${colors.reset}   ${report.riskSummary.MEDIUM}`);
    console.log(`  ${colors.cyan}${colors.bold}Low:${colors.reset}      ${report.riskSummary.LOW}\n`);

    if (report.findings.length === 0) {
      console.log(`${colors.green}✔ All schemas comply with PostgreSQL & Supabase RLS security standards.${colors.reset}\n`);
      return;
    }

    console.log(`${colors.bold}Identified Schema Violations & Hazards (${report.findings.length}):${colors.reset}\n`);

    report.findings.forEach((f, idx) => {
      const badge = this.getBadge(f.risk);
      console.log(`${colors.gray}─[ #${idx + 1} ]──────────────────────────────────────────────────${colors.reset}`);
      console.log(`${badge} ${colors.bold}${f.title}${colors.reset}  ${colors.gray}(${f.code})${colors.reset}`);
      console.log(`  ${colors.dim}Table:${colors.reset}       ${colors.cyan}${f.tableName}${colors.reset}${f.columnName ? ` › Column: ${colors.yellow}${f.columnName}${colors.reset}` : ''}`);
      console.log(`  ${colors.dim}Description:${colors.reset} ${f.description}`);
      console.log(`  ${colors.dim}Remediation:${colors.reset} ${colors.green}${f.remediation}${colors.reset}`);
      console.log(`  ${colors.dim}SQL Fix:${colors.reset}     ${colors.gray}${f.sqlSnippet}${colors.reset}\n`);
    });

    console.log(`${colors.gray}─────────────────────────────────────────────────────────────${colors.reset}`);
    console.log(`${colors.dim}💡 Run 'schemavault inspect --web' to view the interactive ER Diagram Studio.${colors.reset}\n`);
  }

  private static getBadge(risk: RiskLevel): string {
    switch (risk) {
      case 'CRITICAL':
        return `${colors.bgRed} CRITICAL ${colors.reset}`;
      case 'HIGH':
        return `${colors.magenta}${colors.bold}[HIGH]${colors.reset}`;
      case 'MEDIUM':
        return `${colors.yellow}${colors.bold}[MED]${colors.reset}`;
      case 'LOW':
        return `${colors.cyan}${colors.bold}[LOW]${colors.reset}`;
    }
  }
}

