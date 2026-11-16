# SchemaVault CLI Cheatsheet

```bash
# Lint migration files
schemavault lint supabase/migrations/*.sql

# Fail CI on destructive statements
schemavault lint migrations/*.sql --fail-on-destructive --strict

# Synthesize Mermaid ER Diagram
schemavault erd migrations/schema.sql

# Launch Migration Studio
schemavault studio --port 5050
```
