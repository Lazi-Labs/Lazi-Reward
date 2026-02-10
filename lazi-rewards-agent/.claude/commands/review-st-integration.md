Review and validate all ServiceTitan/ST-LAZI integration points in the LAZI Rewards codebase.

## Check These Integration Points

### 1. Database Queries
Verify all queries against ST-LAZI tables:
- `master.customers` - Are we selecting the right columns? Is `st_id` used correctly?
- `master.jobs` - Are we filtering by correct status values?
- `master.invoices` - Are we checking payment status before awarding points?
- `crm.customer_360` - Are we using the materialized view correctly?

### 2. Data Mapping
Verify Zod schemas match ST-LAZI table structures:
- Customer schema matches `master.customers` columns
- Job schema handles all status values ServiceTitan uses
- Invoice amounts use correct precision (NUMERIC(12,2))

### 3. Outbound Mutations
If we write back to ServiceTitan via `outbound.mutations`:
- Correct `entity_type` values
- Proper `payload` structure
- Idempotency keys to prevent duplicates
- Error handling for mutation failures

### 4. Sync Timing
- Points calculations account for ST-LAZI sync delays (5-15 min for P1 entities)
- UI shows "last synced" timestamp where relevant
- Stale data warnings if sync is delayed

### 5. ID Consistency
- `st_id` (ServiceTitan ID) vs internal `id` usage is consistent
- Foreign key references use the correct ID type
- No mixing of ST IDs and internal IDs

## Report Format
```
## ST-LAZI Integration Review

### ✅ Correct
- [list verified integration points]

### ❌ Issues Found
- [list problems with file:line references]

### ⚠️ Potential Risks
- [list things that could break with sync timing, schema changes, etc.]
```
