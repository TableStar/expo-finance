import { db } from '../db/schema';

export async function setActiveAccountId(id: number) {
  await db.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('activeAccountId', ?)",
    String(id)
  );
}

export async function getActiveAccountId() {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'activeAccountId'"
  );

  if (row === null) return null;

  const parsed = Number(row.value);
  if (isNaN(parsed)) return null;
  return parsed;
}
