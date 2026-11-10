import fs from 'node:fs';
import path from 'node:path';
import { banner, log, colors } from './utils/logger.js';
import { SchemaEngine } from './core/engine.js';
import { TerminalReporter } from './ui/terminal.js';
import { WebStudio } from './ui/web.js';

export function runCli(argv: string[]): void {
  const args = argv.slice(2);
  const command = args[0] || 'lint';

  if (command === '--help' || command === '-h' || command === 'help') {
    banner();
    printHelp();
    return;
  }

  banner();

  if (command === 'lint' || command === 'audit' || command === 'scan') {
    const targetPath = args[1] && !args[1].startsWith('--') ? args[1] : '.';
    const isWeb = args.includes('--web');
    const isJson = args.includes('--json');
    const exportPath = getFlagValue(args, '--export');
    const exportMermaid = getFlagValue(args, '--mermaid');
    const minScore = parseInt(getFlagValue(args, '--min-score') || '0', 10);
    const failOn = getFlagValue(args, '--fail-on'); // 'critical' | 'high'

    log.info(`Inspecting database schema in: ${colors.bold}${targetPath}${colors.reset}`);

    const report = SchemaEngine.analyzePath(path.resolve(process.cwd(), targetPath));

    if (isJson) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    // Terminal summary
    TerminalReporter.render(report);

    // Export HTML report
    if (exportPath) {
      const html = WebStudio.exportHtml(report);
      fs.writeFileSync(path.resolve(process.cwd(), exportPath), html, 'utf-8');
      log.success(`Exported standalone Schema Studio to: ${colors.bold}${exportPath}${colors.reset}`);
    }

    // Export raw Mermaid ERD
    if (exportMermaid) {
      fs.writeFileSync(path.resolve(process.cwd(), exportMermaid), report.mermaidErDiagram, 'utf-8');
      log.success(`Exported Mermaid ER diagram to: ${colors.bold}${exportMermaid}${colors.reset}`);
    }

    // Launch Web Studio
    if (isWeb) {
      WebStudio.serve(report);
      return;
    }

    // CI/CD Failure Gates
    if (minScore > 0 && report.safetyScore < minScore) {
      log.error(`Schema safety score (${report.safetyScore}%) fell below required threshold (${minScore}%). Failing CI gate.`);
      process.exit(1);
    }

    if (failOn === 'critical' && report.riskSummary.CRITICAL > 0) {
      log.error(`Detected ${report.riskSummary.CRITICAL} CRITICAL schema hazards. Failing CI gate.`);
      process.exit(1);
    }

    if (failOn === 'high' && (report.riskSummary.CRITICAL > 0 || report.riskSummary.HIGH > 0)) {
      log.error(`Detected HIGH/CRITICAL schema hazards. Failing CI gate.`);
      process.exit(1);
    }

    return;
  }

  if (command === 'visualize' || command === 'studio') {
    const targetPath = args[1] && !args[1].startsWith('--') ? args[1] : '.';
    const report = SchemaEngine.analyzePath(path.resolve(process.cwd(), targetPath));
    WebStudio.serve(report);
    return;
  }

  log.warn(`Unknown command '${command}'`);
  printHelp();
}

function getFlagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
    return args[idx + 1];
  }
  return undefined;
}

function printHelp(): void {
  console.log(`
${colors.bold}USAGE:${colors.reset}
  $ schemavault <command> [directory/file] [options]

${colors.bold}COMMANDS:${colors.reset}
  ${colors.cyan}lint, scan [path]${colors.reset}       Lint PostgreSQL/Supabase schema for safety hazards (default: '.')
  ${colors.cyan}visualize, studio [path]${colors.reset} Launch interactive browser ER Diagram studio
  ${colors.cyan}help, --help${colors.reset}            Show help documentation

${colors.bold}OPTIONS:${colors.reset}
  ${colors.yellow}--web${colors.reset}                   Start interactive browser Studio after analysis
  ${colors.yellow}--export <file.html>${colors.reset}  Save static standalone HTML schema dashboard
  ${colors.yellow}--mermaid <file.mmd>${colors.reset} Save raw Mermaid.js ER diagram
  ${colors.yellow}--json${colors.reset}                Output machine-readable JSON for CI/CD
  ${colors.yellow}--min-score <score>${colors.reset}   Fail process if safety score is below score (0-100)
  ${colors.yellow}--fail-on <severity>${colors.reset}  Exit with code 1 on 'critical' or 'high' findings

${colors.bold}EXAMPLES:${colors.reset}
  $ schemavault lint ./supabase/migrations
  $ schemavault lint schema.sql --web
  $ schemavault lint . --fail-on critical --min-score 85
  $ schemavault lint . --export ./schema-report.html --mermaid ./erd.mmd
`);
}

