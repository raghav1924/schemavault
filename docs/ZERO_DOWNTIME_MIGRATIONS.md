# Expand and Contract Migration Pattern

Safely rename columns or tables without application downtime:
1. **Expand**: Add the new column as nullable; dual-write in application code.
2. **Backfill**: Migrate historical records asynchronously.
3. **Contract**: Switch reads to the new column; drop the deprecated column in a subsequent release.
