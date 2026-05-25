import { Transaction } from '@/types/transactionType';
import { FilterType } from '@/types/types';

export function groupByDate(transactions: Transaction[]) {
  const map = new Map<string, Transaction[]>();
  for (const tr of transactions) {
    const list = map.get(tr.date) ?? [];
    list.push(tr);
    map.set(tr.date, list);
  }

  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export function formatDateLabel(dateStr: string) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatYMD(d:Date){
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getDateRange(
  filter: FilterType,
  offset: number
): {
  startDate: string | undefined;
  endDate: string | undefined;
  label: string;
} {
  const now = new Date();

  const formatDisplay = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString('id-ID', opts);

  if (filter === 'Daily') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const ymd = formatYMD(d);

    let label = formatDisplay(d, { day: 'numeric', month: 'short', year: 'numeric' });
    if (offset === 0) label = 'Today';
    if (offset === -1) label = 'Yesterday';
    return { startDate: ymd, endDate: ymd, label };
  }

  if (filter === 'Weekly') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset * 7);
    const day = d.getDay();

    const diff = day === 0 ? -6 : 1 - day;

    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    const label = `${formatDisplay(start, { day: 'numeric', month: 'short' })} - ${formatDisplay(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    return { startDate: formatYMD(start), endDate: formatYMD(end), label };
  }

  if (filter === 'Monthly') {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return {
      startDate: formatYMD(start),
      endDate: formatYMD(end),
      label: formatDisplay(start, { month: 'long', year: 'numeric' }),
    };
  }

  if (filter === 'Yearly') {
    const targetYear = now.getFullYear() + offset;
    const start = new Date(targetYear, 0, 1);
    const end = new Date(targetYear, 11, 31);
    return {
      startDate: formatYMD(start),
      endDate: formatYMD(end),
      label: targetYear.toString(),
    };
  }

  //All
  return { startDate: undefined, endDate: undefined, label: 'All Time' };
}
