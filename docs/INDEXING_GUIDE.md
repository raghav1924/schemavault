# Foreign Key Indexing & Query Optimization

PostgreSQL does not automatically index foreign key columns.
Without an explicit index, deleting a parent row initiates a sequential scan on the child table, leading to connection exhaustion.
