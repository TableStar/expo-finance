import { Account, AccountFormData } from '@/types/accountType';
import { db } from './schema';

export async function addAccount(data: AccountFormData): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO accounts (name, icon, color) VALUES (?,?,?)',
    data.name,
    data.icon,
    data.color ?? '#901E3E'
  );
  return result.lastInsertRowId;
}

export async function getAccounts() {
  return await db.getAllAsync<Account>('SELECT * FROM accounts ORDER BY name ASC');
}

export async function getAccountCount() {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM accounts'
  );
  return result?.count ?? 0;
}

export async function updateAccount(id: number, updates: Partial<AccountFormData>) {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.icon !== undefined) {
    fields.push('icon = ?');
    values.push(updates.icon);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }

  if (fields.length === 0) {
    return;
  }

  values.push(id);
  const sql = `UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`;
  await db.runAsync(sql, ...values);
}

export async function deleteAccount(id: number) {
  await db.runAsync('DELETE FROM transactions WHERE account_id = ?', id);
  await db.runAsync('DELETE FROM accounts WHERE id = ?', id);
}
