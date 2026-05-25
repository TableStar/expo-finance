import { Transaction, TransactionType } from '@/types/transactionType';
import { db } from './schema';
import { addAccount } from './accounts';

type AddTransactionData = {
  type: 'in' | 'out';
  amount: number;
  notes: string | null;
  date: string;
  time: string;
  account_id: number;
};

type GetTransactionsFilters = {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  accountId?: number;
};

type UpdateTransactionData = Partial<Omit<Transaction, 'id' | 'created_at' | 'deleted_at'>>;

export async function addTransaction(data: AddTransactionData): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO transactions (type, amount, notes, date, time, account_id) VALUES (?,?,?,?,?,?)',
    data.type,
    data.amount,
    data.notes,
    data.date,
    data.time,
    data.account_id
  );
  return result.lastInsertRowId;
}

export async function getTransactions(filters?: GetTransactionsFilters): Promise<Transaction[]> {
  let sql = 'SELECT * FROM transactions WHERE deleted_at is NULL';
  const params: (string | number)[] = [];

  if (filters?.accountId) {
    sql += ' AND account_id = ?';
    params.push(filters.accountId);
  }

  if (filters?.type) {
    sql += ' AND type = ?';
    params.push(filters.type);
  }

  if (filters?.startDate) {
    sql += ' AND date >= ?';
    params.push(filters.startDate);
  }
  if (filters?.endDate) {
    sql += ' AND date <= ?';
    params.push(filters.endDate);
  }

  sql += ' ORDER BY date DESC, time DESC';

  return db.getAllAsync<Transaction>(sql, ...params);
}

export async function updateTransaction(id: number, updates: UpdateTransactionData) {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.account_id !== undefined) {
    fields.push('account_id = ?');
    values.push(updates.account_id);
  }
  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }
  if (updates.amount !== undefined) {
    fields.push('amount = ?');
    values.push(updates.amount);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }
  if (updates.date !== undefined) {
    fields.push('date = ?');
    values.push(updates.date);
  }
  if (updates.time !== undefined) {
    fields.push('time = ?');
    values.push(updates.time);
  }

  if (fields.length === 0) {
    return;
  }

  values.push(id);
  const sql = `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`;
  await db.runAsync(sql, ...values);
}

export async function deleteTransaction(id: number): Promise<void> {
  await db.runAsync(
    "UPDATE transactions SET deleted_at = datetime('now', 'localtime') WHERE id = ?",
    id
  );
}

export async function getTotalsByDateRange(startDate: string, endDate: string, accountId?: number) {
  let sql = `
        SELECT type, SUM(amount) as total
        FROM transactions
        WHERE deleted_at IS NULL and date BETWEEN ? AND ?
        
    `;
  const params: (string | number)[] = [startDate, endDate];

  if (accountId) {
    sql += ' AND account_id = ?';
    params.push(accountId);
  }

  sql += ' GROUP BY type';

  const rows = await db.getAllAsync<{ type: 'in' | 'out'; total: number }>(sql, ...params);

  let income = 0;
  let expense = 0;

  for (const row of rows) {
    if (row.type === 'in') {
      income = row.total;
    } else {
      expense = row.total;
    }
  }

  return { income, expense };
}

export async function getBalance(beforeDate: string, accountId?: number) {
  let sql = `
  SELECT SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END) as balance
  FROM transactions
  WHERE deleted_at IS NULL AND date < ?
  `;

  const params: (string | number)[] = [beforeDate];

  if (accountId) {
    sql += ' AND account_id = ?';
    params.push(accountId);
  }
  const res = await db.getFirstAsync<{ balance: number | null }>(sql, ...params);
  return res?.balance ?? 0;
}

export async function countTransactionByAcct(id: number) {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions where account_id = ?',
    id
  );
  return result?.count ?? 0;
}

export async function seedData() {
  const kasId = await addAccount({ name: 'Kas', icon: 'bank', color: '#1E3A8A' });
  const dompetId = await addAccount({ name: 'Dompet', icon: 'wallet', color: '#901E3E' });
  const gopayId = await addAccount({ name: 'Gopay', icon: 'cellphone', color: '#6B21A8' });

  await addTransaction({
    account_id: dompetId,
    type: 'in',
    amount: 500000,
    notes: 'Saldo Awal',
    date: daysAgo(30),
    time: '00:00',
  });
  await addTransaction({
    account_id: kasId,
    type: 'in',
    amount: 2000000,
    notes: 'Saldo Awal',
    date: daysAgo(30),
    time: '00:00',
  });
  await addTransaction({
    account_id: gopayId,
    type: 'in',
    amount: 150000,
    notes: 'Saldo Awal',
    date: daysAgo(30),
    time: '00:00',
  });
  function daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }
  const mockTrans = [
    {
      type: 'in' as const,
      amount: 2000000,
      notes: 'Gaji bulanan',
      date: daysAgo(0),
      time: '09:00',
      account_id: kasId,
    },
    {
      type: 'out' as const,
      amount: 20000,
      notes: 'Makan siang',
      date: daysAgo(0),
      time: '12:30',
      account_id: gopayId,
    },
    {
      type: 'out' as const,
      amount: 50000.05,
      notes: 'Bensin',
      date: daysAgo(1),
      time: '07:45',
      account_id: dompetId,
    },
    {
      type: 'in' as const,
      amount: 150000.5,
      notes: 'Jual barang',
      date: daysAgo(1),
      time: '14:00',
      account_id: kasId,
    },
    {
      type: 'out' as const,
      amount: 35000.12,
      notes: 'Beli pulsa',
      date: daysAgo(2),
      time: '10:00',
      account_id: gopayId,
    },
    {
      type: 'out' as const,
      amount: 12000,
      notes: 'Kopi pagi',
      date: daysAgo(0),
      time: '07:00',
      account_id: dompetId,
    },
    {
      type: 'out' as const,
      amount: 65000,
      notes: 'Belanja warung',
      date: daysAgo(1),
      time: '18:30',
      account_id: gopayId,
    },
    {
      type: 'in' as const,
      amount: 500000.12,
      notes: 'Freelance',
      date: daysAgo(2),
      time: '16:00',
      account_id: kasId,
    },
    {
      type: 'out' as const,
      amount: 30000.34,
      notes: 'Parkir mall',
      date: daysAgo(3),
      time: '13:00',
      account_id: dompetId,
    },
    {
      type: 'in' as const,
      amount: 100000.23,
      notes: 'Refund',
      date: daysAgo(3),
      time: '11:00',
      account_id: kasId,
    },
    {
      type: 'out' as const,
      amount: 8500,
      notes: 'Parkir kantor',
      date: daysAgo(0),
      time: '08:15',
      account_id: dompetId,
    },
    {
      type: 'out' as const,
      amount: 45000,
      notes: 'Nasi padang',
      date: daysAgo(2),
      time: '13:00',
      account_id: gopayId,
    },
  ];

  for (const tr of mockTrans) {
    await addTransaction(tr);
  }
}
