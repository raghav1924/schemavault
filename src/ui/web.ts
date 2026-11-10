import http from 'node:http';
import { SchemaAnalysisReport } from '../core/types.js';
import { log, colors } from '../utils/logger.js';

export class WebStudio {
  public static serve(report: SchemaAnalysisReport, port = 4880): void {
    const html = this.renderHtml(report);

    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });

    server.listen(port, () => {
      log.success(`SchemaVault Migration Studio: ${colors.bold}${colors.cyan}http://localhost:${port}${colors.reset}`);
      console.log(`${colors.dim}Explore interactive ER diagrams, RLS checks and migration safety metrics.${colors.reset}\n`);
    });
  }

  public static exportHtml(report: SchemaAnalysisReport): string {
    return this.renderHtml(report);
  }

  private static renderHtml(report: SchemaAnalysisReport): string {
    const scoreColor = report.safetyScore >= 80 ? '#10b981' : report.safetyScore >= 60 ? '#f59e0b' : '#ef4444';

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SchemaVault — PostgreSQL & Supabase Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    :root {
      --bg: #09090b;
      --card-bg: #121215;
      --card-border: #27272a;
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
      --accent: #06b6d4;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 2rem;
      border-bottom: 1px solid var(--card-border);
      background: #0d0d10;
    }
    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .brand-icon {
      font-size: 1.4rem;
      background: rgba(6, 182, 212, 0.1);
      border: 1px solid rgba(6, 182, 212, 0.25);
      border-radius: 8px;
      padding: 0.35rem 0.6rem;
    }
    .brand h1 { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; }
    .brand p { font-size: 0.8rem; color: var(--text-muted); }
    .author-badge {
      font-size: 0.75rem;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      background: #18181b;
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      text-decoration: none;
    }
    .author-badge:hover { color: var(--accent); border-color: var(--accent); }

    .main-grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      flex: 1;
      overflow: hidden;
    }
    .sidebar {
      background: var(--card-bg);
      border-right: 1px solid var(--card-border);
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .metric-card {
      background: #18181b;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 1rem;
    }
    .metric-title { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .metric-value { font-size: 2rem; font-weight: 700; margin-top: 0.25rem; font-family: 'Geist Mono', monospace; }

    .table-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .table-badge {
      padding: 0.6rem 0.8rem;
      background: #18181b;
      border: 1px solid var(--card-border);
      border-radius: 6px;
      font-size: 0.8rem;
      font-family: 'Geist Mono', monospace;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .studio-content {
      padding: 2rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      background: radial-gradient(circle at 50% 50%, #15151c 0%, #09090b 100%);
    }
    .mermaid-box {
      background: #121215;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 2rem;
      overflow-x: auto;
    }
    .finding-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 1.25rem;
      margin-top: 0.75rem;
    }
    .finding-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-CRITICAL { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-HIGH { background: rgba(217, 70, 239, 0.15); color: #d946ef; border: 1px solid rgba(217, 70, 239, 0.3); }
    .badge-MEDIUM { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }

    pre {
      background: #09090b;
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 0.75rem;
      font-family: 'Geist Mono', monospace;
      font-size: 0.75rem;
      color: #38bdf8;
      margin-top: 0.5rem;
    }
    footer {
      padding: 1.25rem 2rem;
      border-top: 1px solid var(--card-border);
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
      background: #09090b;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-icon">🏛️</div>
      <div>
        <h1>SchemaVault Studio</h1>
        <p>PostgreSQL & Supabase Architecture & Safety Inspector</p>
      </div>
    </div>
    <a href="https://jatinsh.netlify.app/" target="_blank" class="author-badge">Built by Jatin Sharma ↗</a>
  </header>

  <div class="main-grid">
    <aside class="sidebar">
      <div class="metric-card">
        <div class="metric-title">Schema Safety Score</div>
        <div class="metric-value" style="color: ${scoreColor};">${report.safetyScore}%</div>
      </div>

      <div class="metric-card">
        <div class="metric-title">Database Entities</div>
        <div class="metric-value">${report.totalTables} <span style="font-size: 1rem; color: var(--text-muted);">tables</span></div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${report.totalColumns} total columns indexed</div>
      </div>

      <div>
        <div class="metric-title" style="margin-bottom: 0.75rem;">Tables (${report.totalTables})</div>
        <div class="table-list">
          ${Object.values(report.tables).map(t => `
            <div class="table-badge">
              <span>${t.name}</span>
              <span style="font-size: 0.65rem; color: ${t.rlsEnabled ? '#34d399' : '#f87171'};">
                ${t.rlsEnabled ? 'RLS ✔' : 'NO RLS ⚠'}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    </aside>

    <main class="studio-content">
      <section>
        <h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">Entity-Relationship Graph (ERD)</h2>
        <div class="mermaid-box">
          <div class="mermaid">
${report.mermaidErDiagram}
          </div>
        </div>
      </section>

      <section>
        <h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">Migration & Security Linter Issues (${report.findings.length})</h2>
        ${report.findings.length === 0 ? `
          <div class="finding-card" style="text-align: center; padding: 2rem;">
            <span style="color: var(--success); font-weight: 600;">✔ Production Ready: No schema hazards or un-jailed tables detected.</span>
          </div>
        ` : report.findings.map(f => `
          <div class="finding-card">
            <div class="finding-header">
              <strong style="color: #fff;">${f.title}</strong>
              <span class="badge badge-${f.risk}">${f.risk}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">${f.description}</div>
            <div style="font-size: 0.8rem; color: #34d399; margin-top: 0.5rem;"><strong>Remediation:</strong> ${f.remediation}</div>
            <pre><code>${f.sqlSnippet}</code></pre>
          </div>
        `).join('')}
      </section>
    </main>
  </div>

  <footer>
    SchemaVault is open-source software created by <a href="https://jatinsh.netlify.app/" target="_blank" style="color: var(--accent); text-decoration: none;">Jatin Sharma</a> • Distributed under MIT License
  </footer>

  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#121215',
        primaryColor: '#1e293b',
        lineColor: '#06b6d4'
      }
    });
  </script>
</body>
</html>`;
  }
}

