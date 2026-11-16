# Postgres Table Lock Levels & Safe Migrations

Schema changes that trigger `AccessExclusiveLock` freeze concurrent reads and writes:
- `ALTER TABLE ... ADD COLUMN ... NOT NULL` without default values.
- `CREATE INDEX` without `CONCURRENTLY`.
- `ALTER TABLE ... ALTER COLUMN TYPE ...`.
