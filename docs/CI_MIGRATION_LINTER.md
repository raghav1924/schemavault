# Pull Request Migration Checks

Block dangerous schema migrations in CI:
```yaml
- name: Lint Database Migrations
  run: node dist/bin.js lint supabase/migrations/*.sql --strict --fail-on-destructive
```
