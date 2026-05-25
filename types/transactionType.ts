import { Account, AccountFormData } from './accountType';

export type TransactionType = 'in' | 'out';

export type Transaction = {
  id: number;
  account_id: number;
  type: TransactionType;
  amount: number;
  notes: string | null;
  date: string;
  created_at: string;
  time: string;
  deleted_at: string | null;
};

export type TransactionFilters = {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  accountId?: number;
};

export type TransactionState = {
  accounts: Account[];
  activeAccountId: number | null;
  transactions: Transaction[];
  filters: TransactionFilters;
  previousBalance: number | null;
};

export type TransactionActions = {
  addTransaction: (
    transaction: Omit<Transaction, 'id' | 'created_at' | 'deleted_at'>
  ) => Promise<void>;
  updateTransaction: (id: number, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  setFilters: (filters: TransactionFilters) => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadAccounts: () => Promise<void>;
  setActiveAccount: (id: number) => Promise<void>;
  addAccount: (data: AccountFormData) => Promise<number>;
  updateAccount: (id: number, updates: Partial<AccountFormData>) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
};

export type TransactionStore = TransactionState & TransactionActions;
