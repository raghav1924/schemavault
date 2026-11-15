# Supabase Row Level Security (RLS) Best Practices

SchemaVault audits PostgreSQL tables to ensure:
- Every public table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- At least one permissive policy exists for authenticated users.
- Service role policies are properly segregated.
