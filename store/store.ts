import { TransactionState, TransactionStore } from '@/types/transactionType';
import {
  addTransaction as addTransactionDb,
  getTransactions,
  updateTransaction as updateTransactionDb,
  deleteTransaction as deleteTransactionDb,
  getBalance,
} from '@/lib/db/transactions';
import { create } from 'zustand';
import {
  getAccounts,
  addAccount as addAccountDb,
  updateAccount as updateAccountDb,
  deleteAccount as deleteAccountDb,
} from '@/lib/db/accounts';
import { AccountFormData } from '@/types/accountType';
import { getActiveAccountId, setActiveAccountId } from '@/lib/utils/storage';

const initialState: TransactionState & { isLoading: boolean } = {
  transactions: [],
  filters: {},
  isLoading: false,
  previousBalance: null,
  accounts: [],
  activeAccountId: null,
};

export const useTransactions = create<TransactionStore & { isLoading: boolean }>((set, get) => ({
  ...initialState,
  loadAccounts: async () => {
    set({ isLoading: true });
    const accounts = await getAccounts();
    set({ accounts, isLoading: false });
  },
  setActiveAccount: async (id) => {
    await setActiveAccountId(id);
    set({ activeAccountId: id });
    await get().loadTransactions();
  },
  addAccount: async (data: AccountFormData) => {
    set({ isLoading: true });
    const accountId = await addAccountDb(data);
    const accounts = await getAccounts();
    set({ accounts });
    if (get().activeAccountId === null) {
      await get().setActiveAccount(accountId);
    }
    set({ isLoading: false });
    return accountId;
  },
  updateAccount: async (id, updates) => {
    set({ isLoading: true });
    await updateAccountDb(id, updates);
    const accounts = await getAccounts();
    set({ accounts, isLoading: false });
  },
  deleteAccount: async (id: number) => {
    set({ isLoading: true });
    await deleteAccountDb(id);
    const accounts = await getAccounts();
    if (get().activeAccountId === id) {
      if (accounts.length > 0) {
        await get().setActiveAccount(accounts[0].id);
      } else {
        set({ activeAccountId: null });
      }
    }
    set({ accounts,isLoading: false });
  },
  addTransaction: async (transaction) => {
    set({ isLoading: true });
    if (!transaction.account_id) {
      const activeId = get().activeAccountId;
      if (activeId === null) throw new Error('No active account selected');
      transaction.account_id = activeId;
    }
    try {
      await addTransactionDb({
        type: transaction.type,
        amount: transaction.amount,
        notes: transaction.notes,
        date: transaction.date,
        time: transaction.time,
        account_id: transaction.account_id,
      });
      const rows = await getTransactions({ accountId: get().activeAccountId ?? undefined });
      set({ transactions: rows, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  updateTransaction: async (id, updates) => {
    set({ isLoading: true });
    try {
      await updateTransactionDb(id, updates);
      const rows = await getTransactions({ accountId: get().activeAccountId ?? undefined });
      set({ isLoading: false, transactions: rows });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  deleteTransaction: async (id) => {
    set({ isLoading: true });
    try {
      await deleteTransactionDb(id);
      const rows = await getTransactions({ accountId: get().activeAccountId ?? undefined });
      set({ transactions: rows, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  setFilters: async (filters) => {
    const filtersWithAcct = { ...filters, accountId: get().activeAccountId ?? undefined };
    try {
      if (!filtersWithAcct.startDate) {
        const rows = await getTransactions(filtersWithAcct);
        set({ transactions: rows, isLoading: false, previousBalance: null });
        return;
      }
      const [rows, balance] = await Promise.all([
        getTransactions(filtersWithAcct),
        getBalance(filtersWithAcct.startDate,filtersWithAcct.accountId),
      ]);
      set({ transactions: rows, isLoading: false, previousBalance: balance });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  loadTransactions: async () => {
    set({ isLoading: true });
    try {
      const rows = await getTransactions({ accountId: get().activeAccountId ?? undefined });
      set({ transactions: rows, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));

export async function initStore() {
  
  await useTransactions.getState().loadAccounts();
  const savedId = await getActiveAccountId();
  const accounts = useTransactions.getState().accounts;

  if (accounts.length === 0) {
    return;
  }

  if (savedId !== null && accounts.find((a) => a.id === savedId)) {
    await useTransactions.getState().setActiveAccount(savedId);
  } else {
    await useTransactions.getState().setActiveAccount(accounts[0].id);
  }
}
