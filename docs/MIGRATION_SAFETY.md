# Relational Database Migration Safety

Schema changes that can cause table locks or irreversible data loss:
- `DROP TABLE` and `DROP COLUMN`: Permanent data deletion.
- `ALTER TABLE ... ADD COLUMN ... NOT NULL` without default values.
- In-place column type alterations causing full table rewrites.
