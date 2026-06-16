// Drizzle migration example for MVP fields
// Run with your project's migration runner; shown here as illustrative code

import { sql } from 'drizzle-orm';

export async function up(db: any): Promise<void> {
  await db.execute(sql`
    ALTER TABLE plan_days ADD COLUMN IF NOT EXISTS hotel_poi_id TEXT;
  `);

  await db.execute(sql`
    ALTER TABLE plan_slots ADD COLUMN IF NOT EXISTS status_checked BOOLEAN NOT NULL DEFAULT false;
  `);

  await db.execute(sql`
    ALTER TABLE plan_slots ADD COLUMN IF NOT EXISTS overrides JSONB;
  `);
}

export async function down(db: any): Promise<void> {
  await db.execute(sql`ALTER TABLE plan_slots DROP COLUMN IF EXISTS overrides;`);
  await db.execute(sql`ALTER TABLE plan_slots DROP COLUMN IF EXISTS status_checked;`);
  await db.execute(sql`ALTER TABLE plan_days  DROP COLUMN IF EXISTS hotel_poi_id;`);
}


