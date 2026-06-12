---
name: Drizzle postgres-js execute shape
description: db.execute() with postgres-js driver returns an array directly, not { rows: [] }
---

When using `drizzle-orm/postgres-js` (as in `packages/db/src/index.ts`), calling `db.execute(sql`...`)` returns the rows as a plain array, NOT wrapped in `{ rows: [] }` like node-postgres/pg.

**Why:** postgres-js driver has a different result shape than pg.

**How to apply:**
```typescript
// WRONG (node-postgres pattern):
const row = (await db.execute(sql`...`)).rows[0] ?? {};

// CORRECT (postgres-js pattern):
const [row] = (await db.execute(sql`...`)) as any[] ?? [{}];
// or:
const rows = await db.execute(sql`...`);
const row = rows[0] ?? {};
```
