export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ColumnDefinition {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string;
  references?: {
    table: string;
    column: string;
  };
}

export interface TableDefinition {
  name: string;
  schema: string;
  columns: Record<string, ColumnDefinition>;
  primaryKeys: string[];
  indexes: string[];
  rlsEnabled: boolean;
  policies: string[];
}

export interface SchemaLinterFinding {
  code: string; // e.g. RLS-001, DATA-001
  title: string;
  risk: RiskLevel;
  tableName: string;
  columnName?: string;
  description: string;
  remediation: string;
  sqlSnippet: string;
}

export interface SchemaAnalysisReport {
  timestamp: string;
  targetPath: string;
  totalTables: number;
  totalColumns: number;
  tables: Record<string, TableDefinition>;
  findings: SchemaLinterFinding[];
  safetyScore: number; // 0 - 100
  riskSummary: Record<RiskLevel, number>;
  mermaidErDiagram: string;
}
