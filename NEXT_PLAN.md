# Accounts (CoA) — Implementation Plan

## Resolved Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | First-time flow | Modal overlay, reusable `CreateAccountModal` + `AccountsModal` with search/select |
| 2 | Account switching | Tap header account name → opens `AccountsModal` |
| 3 | "All Accounts" view | **Removed** — always require an active account. If none → show CreateAccountModal |
| 4 | Opening balance | Included in CreateAccountModal (name, icon, +/- toggle, amount, date) |
| 5 | DB migration | Drop & recreate tables with version check |

---

## Step 1: `types/accountType.ts` (NEW)

```
TYPE Account = {
  id: number
  name: string
  icon: string       // 'wallet' | 'bank' | 'cellphone'
  color: string      // hex, default '#901E3E'
  created_at: string
}

TYPE AccountFormData = {
  name: string
  icon: string
  color?: string
}
```

---

## Step 2: Update `types/transactionType.ts`

```
// ADD to Transaction type:
  account_id: number

// ADD to TransactionFilters:
  accountId?: number

// ADD to TransactionState:
  accounts: Account[]
  activeAccountId: number | null

// ADD to TransactionActions:
  loadAccounts: () => Promise<void>
  setActiveAccount: (id: number) => Promise<void>
  addAccount: (data: AccountFormData) => Promise<number>
  updateAccount: (id: number, updates: Partial<AccountFormData>) => Promise<void>
  deleteAccount: (id: number) => Promise<void>

```

---

## Step 3: `lib/db/schema.ts` (MODIFIED)

```
FUNCTION initDb():
  1. PRAGMA journal_mode = WAL

  2. Check if accounts table exists:
     result = SELECT name FROM sqlite_master
              WHERE type='table' AND name='accounts'

  3. If result is EMPTY → migration needed:
     DROP TABLE IF EXISTS transactions

  4. CREATE TABLE IF NOT EXISTS accounts (
       id          INTEGER PRIMARY KEY AUTOINCREMENT,
       name        TEXT NOT NULL,
       icon        TEXT NOT NULL DEFAULT 'wallet',
       color       TEXT DEFAULT '#901E3E',
       created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
     )

  5. CREATE TABLE IF NOT EXISTS transactions (
       id          INTEGER PRIMARY KEY AUTOINCREMENT,
       account_id  INTEGER NOT NULL,
       type        TEXT NOT NULL CHECK(type IN ('in', 'out')),
       amount      REAL NOT NULL CHECK(amount > 0),
       notes       TEXT,
       date        TEXT NOT NULL,
       time        TEXT NOT NULL,
        created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
       deleted_at  TEXT,
       FOREIGN KEY (account_id) REFERENCES accounts(id)
     )

  6. CREATE INDEX IF NOT EXISTS idx_transactions_date
       ON transactions(date) WHERE deleted_at IS NULL

  7. CREATE INDEX IF NOT EXISTS idx_transactions_account
       ON transactions(account_id) WHERE deleted_at IS NULL

  8. CREATE TABLE IF NOT EXISTS settings (
       key   TEXT PRIMARY KEY,
       value TEXT
     )

  9. Check if accounts table is EMPTY:
     count = SELECT COUNT(*) FROM accounts

  10. If count === 0:
        dynamic import seedData from './transactions'
        await seedData()   // seeds accounts + transactions with account_ids
```

---

## Step 4: `lib/db/accounts.ts` (NEW)

```
IMPORT db from './schema'
IMPORT { Account, AccountFormData } from '@/types/accountType'

FUNCTION addAccount(data: AccountFormData) → Promise<number>:
  result = db.runAsync(
    "INSERT INTO accounts (name, icon, color) VALUES (?, ?, ?)",
    data.name, data.icon, data.color ?? '#901E3E'
  )
  RETURN result.lastInsertRowId

FUNCTION getAccounts() → Promise<Account[]>:
  RETURN db.getAllAsync<Account>(
    "SELECT * FROM accounts ORDER BY name ASC"
  )

FUNCTION getAccountCount() → Promise<number>:
  result = db.getFirstAsync<{count: number}>(
    "SELECT COUNT(*) as count FROM accounts"
  )
  RETURN result?.count ?? 0

FUNCTION updateAccount(id: number, updates: Partial<AccountFormData>) → Promise<void>:
  // Dynamic UPDATE — same pattern as updateTransaction
  Build SET clause from provided fields (name, icon, color)
  db.runAsync(sql, ...values, id)

FUNCTION deleteAccount(id: number) → Promise<void>:
  // Hard delete with cascade:
  DELETE FROM transactions WHERE account_id = ?
  DELETE FROM accounts WHERE id = ?
```

---

## Step 5: `lib/db/transactions.ts` (MODIFIED)

```
// UPDATE internal types:

TYPE AddTransactionData = {
  type: 'in' | 'out'
  amount: number
  notes: string | null
  date: string
  time: string
  account_id: number        // NEW — required
}

TYPE GetTransactionsFilters = {
  type?: TransactionType
  startDate?: string
  endDate?: string
  accountId?: number        // NEW
}

// UPDATE existing functions:

FUNCTION addTransaction(data: AddTransactionData) → Promise<number>:
  result = db.runAsync(
    "INSERT INTO transactions (type, amount, notes, date, time, account_id)
     VALUES (?, ?, ?, ?, ?, ?)",
    data.type, data.amount, data.notes, data.date, data.time,
    data.account_id
  )
  RETURN result.lastInsertRowId

FUNCTION getTransactions(filters?) → Promise<Transaction[]>:
  sql = "SELECT * FROM transactions WHERE deleted_at IS NULL"
  params = []

  if filters.accountId:
    sql += " AND account_id = ?"
    params.push(filters.accountId)

  // existing: type, startDate, endDate filters — unchanged
  // ...

  sql += " ORDER BY date DESC, time DESC"
  RETURN db.getAllAsync<Transaction>(sql, ...params)

FUNCTION updateTransaction(id, updates) → Promise<void>:
  // ADD to dynamic field builder:
  if updates.account_id !== undefined:
    fields.push("account_id = ?")
    values.push(updates.account_id)
  // rest unchanged

FUNCTION deleteTransaction(id) → Promise<void>:
  // UNCHANGED — soft delete via SET deleted_at

FUNCTION countTransactionByAcct(id: number) → Promise<number>:
  result = db.getFirstAsync<{count: number}>(
    "SELECT COUNT(*) as count FROM transactions WHERE account_id = ?",
    id
  )
  RETURN result?.count ?? 0

FUNCTION getTotalsByDateRange(startDate, endDate, accountId?) → {income, expense}:
  sql = "SELECT type, SUM(amount) as total
         FROM transactions
         WHERE deleted_at IS NULL AND date BETWEEN ? AND ?"
  params = [startDate, endDate]

  if accountId:
    sql += " AND account_id = ?"
    params.push(accountId)

  sql += " GROUP BY type"
  // same aggregation logic

FUNCTION getBalance(beforeDate, accountId?) → Promise<number>:
  sql = "SELECT SUM(CASE WHEN type='in' THEN amount ELSE -amount END) as balance
         FROM transactions
         WHERE deleted_at IS NULL AND date < ?"
  params = [beforeDate]

  if accountId:
    sql += " AND account_id = ?"
    params.push(accountId)

  result = db.getFirstAsync<{balance: number | null}>(sql, ...params)
  RETURN result?.balance ?? 0

// REPLACE seedMockData with seedData:

FUNCTION seedData() → Promise<void>:
  // 1. Insert 3 accounts:
  dompetId = addAccount({ name: 'Dompet', icon: 'wallet', color: '#901E3E' })
  bcaId    = addAccount({ name: 'BCA', icon: 'bank', color: '#1E3A8A' })
  gopayId  = addAccount({ name: 'GoPay', icon: 'cellphone', color: '#6B21A8' })

  // 2. Opening balance transactions:
  addTransaction({ account_id: dompetId, type: 'in', amount: 500000, notes: 'Saldo Awal', date: daysAgo(30), time: '00:00' })
  addTransaction({ account_id: bcaId, type: 'in', amount: 2000000, notes: 'Saldo Awal', date: daysAgo(30), time: '00:00' })
  addTransaction({ account_id: gopayId, type: 'in', amount: 150000, notes: 'Saldo Awal', date: daysAgo(30), time: '00:00' })

  // 3. Regular transactions — distribute across accounts:
  addTransaction({ account_id: dompetId, type: 'in', amount: 2000000, notes: 'Gaji bulanan', date: daysAgo(0), time: '09:00' })
  addTransaction({ account_id: dompetId, type: 'out', amount: 12000, notes: 'Kopi pagi', date: daysAgo(0), time: '07:00' })
  addTransaction({ account_id: dompetId, type: 'out', amount: 8500, notes: 'Parkir kantor', date: daysAgo(0), time: '08:15' })
  addTransaction({ account_id: dompetId, type: 'out', amount: 20000, notes: 'Makan siang', date: daysAgo(0), time: '12:30' })
  addTransaction({ account_id: bcaId, type: 'in', amount: 150000.5, notes: 'Jual barang', date: daysAgo(1), time: '14:00' })
  addTransaction({ account_id: bcaId, type: 'out', amount: 50000.05, notes: 'Bensin', date: daysAgo(1), time: '07:45' })
  addTransaction({ account_id: bcaId, type: 'out', amount: 65000, notes: 'Belanja warung', date: daysAgo(1), time: '18:30' })
  addTransaction({ account_id: gopayId, type: 'in', amount: 500000.12, notes: 'Freelance', date: daysAgo(2), time: '16:00' })
  addTransaction({ account_id: gopayId, type: 'out', amount: 35000.12, notes: 'Beli pulsa', date: daysAgo(2), time: '10:00' })
  addTransaction({ account_id: gopayId, type: 'out', amount: 45000, notes: 'Nasi padang', date: daysAgo(2), time: '13:00' })
  addTransaction({ account_id: bcaId, type: 'out', amount: 30000.34, notes: 'Parkir mall', date: daysAgo(3), time: '13:00' })
  addTransaction({ account_id: bcaId, type: 'in', amount: 100000.23, notes: 'Refund', date: daysAgo(3), time: '11:00' })
```

---

## Step 6: `lib/utils/storage.ts` (NEW)

```
IMPORT db from '@/lib/db/schema'

FUNCTION setActiveAccountId(id: number) → Promise<void>:
  await db.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('activeAccountId', ?)",
    String(id)
  )

FUNCTION getActiveAccountId() → Promise<number | null>:
  row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'activeAccountId'"
  )
  if row is null: RETURN null
  parsed = Number(row.value)
  if isNaN(parsed): RETURN null
  RETURN parsed
```

**Note:** Uses SQLite `settings` table instead of AsyncStorage to avoid native module rebuild (EAS build APK has 15 builds/month limit). Same API interface — drop-in swap.

---

## Step 7: `store/store.ts` (MODIFIED)

```
// ADD imports:
//   Account, AccountFormData from '@/types/accountType'
//   getAccounts, addAccount as addAccountDb, updateAccount as updateAccountDb, deleteAccount as deleteAccountDb from '@/lib/db/accounts'
//   setActiveAccountId, getActiveAccountId from '@/lib/utils/storage'  // now uses SQLite, no AsyncStorage

// UPDATE initial state:
{
  transactions: [],
  filters: {},
  isLoading: false,
  previousBalance: null,
  accounts: [],              // NEW
  activeAccountId: null,     // NEW
}

// === NEW ACTIONS ===

ACTION loadAccounts:
  set { isLoading: true }
  accounts = await getAccounts()
  set { accounts, isLoading: false }

ACTION setActiveAccount(id: number):
  await setActiveAccountId(id)          // persist to AsyncStorage
  set { activeAccountId: id }
  // re-fetch transactions for new active account:
  await get().loadTransactions()        // now filters by activeAccountId

ACTION addAccount(data: AccountFormData) → number:
  set { isLoading: true }
  accountId = await addAccountDb(data)
  accounts = await getAccounts()
  set { accounts }
  // if first account, make it active:
  if get().activeAccountId is null:
    await get().setActiveAccount(accountId)
  set { isLoading: false }
  RETURN accountId

ACTION updateAccount(id, updates):
  set { isLoading: true }
  await updateAccountDb(id, updates)
  accounts = await getAccounts()
  set { accounts, isLoading: false }

ACTION deleteAccount(id: number):
  set { isLoading: true }
  await deleteAccountDb(id)
  accounts = await getAccounts()
  // if deleted was active, switch to first remaining:
  if get().activeAccountId === id:
    if accounts.length > 0:
      await get().setActiveAccount(accounts[0].id)
    else:
      set { activeAccountId: null }
  set { isLoading: false }

// === MODIFIED ACTIONS ===

ACTION addTransaction(transaction):
  set { isLoading: true }
  // Inject active account if not provided:
  if !transaction.account_id:
    transaction.account_id = get().activeAccountId
  await addTransactionDb({
    type, amount, notes, date, time,
    account_id: transaction.account_id,
  })
  rows = await getTransactions({ accountId: get().activeAccountId })
  set { transactions: rows, isLoading: false }

ACTION updateTransaction(id, updates):
  // same pattern — re-fetch filtered by activeAccountId

ACTION deleteTransaction(id):
  // same pattern — re-fetch filtered by activeAccountId

ACTION loadTransactions:
  set { isLoading: true }
  rows = await getTransactions({ accountId: get().activeAccountId })
  set { transactions: rows, isLoading: false }

ACTION setFilters(filters):
  filtersWithAccount = { ...filters, accountId: get().activeAccountId }
  if !filtersWithAccount.startDate:
    rows = await getTransactions(filtersWithAccount)
    set { transactions: rows, isLoading: false, previousBalance: null }
  else:
    [rows, balance] = await Promise.all([
      getTransactions(filtersWithAccount),
      getBalance(filtersWithAccount.startDate, get().activeAccountId),
    ])
    set { transactions: rows, isLoading: false, previousBalance: balance }

// === INIT FUNCTION (exported separately) ===

EXPORT FUNCTION initStore() → Promise<void>:
  await get().loadAccounts()
  savedId = await getActiveAccountId()
  accounts = get().accounts

  if accounts.length === 0:
    // No accounts — first-time state, layout will redirect
    RETURN

  if savedId !== null AND accounts.find(a => a.id === savedId):
    await get().setActiveAccount(savedId)
  else:
    await get().setActiveAccount(accounts[0].id)
```

---

## Step 8: `app/_layout.tsx` (MODIFIED)

```
// ADD imports:
//   router from 'expo-router'
//   useEffect from 'react'
//   useTransactions, initStore from '@/store/store'

// ADD effect in root component for app initialization:
USE EFFECT (runs once on mount):
  initStore().then(() => {
    accounts = useTransactions.getState().accounts
    activeAccountId = useTransactions.getState().activeAccountId
    if accounts.length === 0 OR activeAccountId === null:
      router.replace('/create-account-modal?mode=first-time')
  })

// ADD modal routes to Stack:
<Stack.Screen name="accounts-modal" options={{
  presentation: 'modal',
  animation: 'fade_from_bottom',
  title: 'Accounts',
}} />
<Stack.Screen name="create-account-modal" options={{
  presentation: 'modal',
  animation: 'fade_from_bottom',
  title: 'New Account',
}} />
```

---

## Step 9: `app/index.tsx` (MODIFIED)

```
// REMOVE:
//   const [currAccount, setCurrAccount] = useState('Account_Name')

// ADD:
//   const accounts = useTransactions(s => s.accounts)
//   const activeAccountId = useTransactions(s => s.activeAccountId)
//   const router from 'expo-router'

// DERIVE current account:
const currentAccount = accounts.find(a => a.id === activeAccountId)

// UPDATE header — account name TouchableOpacity:
<TouchableOpacity onPress={() => router.push('/accounts-modal')}>
  <MaterialCommunityIcons name={currentAccount?.icon ?? 'wallet'} size={20} color="white" />
  <Text className="text-xl font-bold text-white">{currentAccount?.name ?? '...'}</Text>
  <MaterialIcons name="arrow-drop-down" size={24} color="white" />
</TouchableOpacity>

// Everything else (filters, income/expense calc, TransactionsList) stays the same.
// Store now filters transactions by activeAccountId.
```

---

## Step 10: `app/accounts-modal.tsx` (NEW)

```
SCREEN AccountsModal:
  accounts = useTransactions(s => s.accounts)
  activeAccountId = useTransactions(s => s.activeAccountId)
  setActiveAccount, deleteAccount = useTransactions(s => s.actions)
  countTransactionByAcct from '@/lib/db/transactions'
  router = useRouter()

  state: search = ""

  filtered = accounts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  FUNCTION handleSelectAccount(id):
    await setActiveAccount(id)
    router.back()

  FUNCTION handleAddAccount:
    router.push('/create-account-modal')

  FUNCTION handleDeleteAccount(id):
    acc = accounts.find(a => a.id === id)
    count = await countTransactionByAcct(id)
    Alert.alert(
      "Delete Account?",
      `This will permanently delete ${count} transactions in this account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteAccount(id)
            // store auto-switches activeAccountId if needed
          }
        }
      ]
    )

  RETURN (
    <View className="flex-1 bg-background">
      {/* Search bar */}
      <View className="px-4 pt-2">
        <TextInput
          placeholder="Search accounts..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Account list */}
      <ScrollView>
        {filtered.map(account => (
          <TouchableOpacity
            key={account.id}
            onPress={() => handleSelectAccount(account.id)}
            onLongPress={() => handleDeleteAccount(account.id)}
          >
            <View className="flex-row items-center gap-3 px-4 py-3">
              <MaterialCommunityIcons name={account.icon} size={24} color={account.color} />
              <Text className="text-foreground">{account.name}</Text>
              {account.id === activeAccountId && (
                <Ionicons name="checkmark" size={20} color="green" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add account button */}
      <TouchableOpacity onPress={handleAddAccount} className="...">
        <Ionicons name="add-circle-outline" size={24} />
        <Text>Add Account</Text>
      </TouchableOpacity>
    </View>
  )
```

---

## Step 11: `app/create-account-modal.tsx` (NEW)

```
SCREEN CreateAccountModal:
  addAccount, setActiveAccount = useTransactions(s => s.actions)
  addTransactionDb from '@/lib/db/transactions'
  router = useRouter()
  params = useLocalSearchParams()
  isFirstTime = params.mode === 'first-time'

  state: name = ""
  state: icon = "wallet"
  state: balanceType = "in"        // 'in' = positive, 'out' = negative/owed
  state: balanceAmount = ""
  state: balanceDate = today        // YYYY-MM-DD format
  state: showDatePicker = false

  ICONS = [
    { name: 'wallet',    label: 'Cash',     icon: 'wallet' },
    { name: 'bank',      label: 'Bank',     icon: 'bank' },
    { name: 'cellphone', label: 'E-Wallet', icon: 'cellphone' },
  ]

  FUNCTION handleSubmit:
    if name.trim() is empty: RETURN

    // 1. Create account:
    accountId = await addAccount({ name: name.trim(), icon })

    // 2. Create opening balance transaction (if amount > 0):
    amount = parseFloat(balanceAmount)
    if amount > 0:
      await addTransactionDb({
        account_id: accountId,
        type: balanceType,
        amount: amount,
        notes: 'Saldo Awal',
        date: balanceDate,
        time: '00:00',
      })

    // 3. Set as active account:
    await setActiveAccount(accountId)

    // 4. Navigate away:
    if isFirstTime:
      router.replace('/')              // clear modal stack, go to main screen
    else:
      router.back()                    // back to accounts-modal

  RETURN (
    <ScrollView className="flex-1 bg-background px-4">

      {/* Name input */}
      <Text>Account Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. My Wallet"
      />

      {/* Icon picker */}
      <Text>Choose Icon</Text>
      <View className="flex-row gap-4">
        {ICONS.map(item => (
          <TouchableOpacity
            key={item.name}
            onPress={() => setIcon(item.name)}
            className={icon === item.name ? 'border-b-2 border-[#901E3E]' : ''}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={40}
              color={icon === item.name ? '#901E3E' : '#888'}
            />
            <Text>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Opening balance */}
      <Text>Opening Balance</Text>

      {/* +/- toggle */}
      <View className="flex-row">
        <TouchableOpacity
          onPress={() => setBalanceType('in')}
          className={balanceType === 'in' ? 'bg-green-500' : 'bg-muted'}
        >
          <Text>+ (Positive)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setBalanceType('out')}
          className={balanceType === 'out' ? 'bg-red-500' : 'bg-muted'}
        >
          <Text>- (Negative / Owed)</Text>
        </TouchableOpacity>
      </View>

      {/* Amount input */}
      <TextInput
        value={balanceAmount}
        onChangeText={setBalanceAmount}
        keyboardType="numeric"
        placeholder="0"
      />

      {/* Date picker — use @react-native-community/datetimepicker (already installed) */}
      <Text>Date</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <Text>{formatDate(balanceDate)}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={new Date(balanceDate)}
          mode="date"
          onChange={(event, date) => {
            setShowDatePicker(false)
            if date: setBalanceDate(formatYMD(date))
          }}
        />
      )}

      {/* Submit */}
      <TouchableOpacity onPress={handleSubmit}>
        <Text>Create Account</Text>
      </TouchableOpacity>

      {/* Cancel — hidden in first-time mode */}
      {!isFirstTime && (
        <TouchableOpacity onPress={() => router.back()}>
          <Text>Cancel</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
```

---

## Implementation Order

| Step | File | Action |
|------|------|--------|
| 1 | `types/accountType.ts` | **NEW** |
| 2 | `types/transactionType.ts` | MODIFY — add account_id, account state/actions |
| 3 | `lib/db/schema.ts` | MODIFY — drop/recreate, accounts + settings tables, updated transactions table, seed check |
| 4 | `lib/db/accounts.ts` | **NEW** — account CRUD |
| 5 | `lib/db/transactions.ts` | MODIFY — account_id in all queries, updated seedData |
| 6 | `lib/utils/storage.ts` | **NEW** — SQLite settings table wrapper (no AsyncStorage) |
| 7 | `store/store.ts` | MODIFY — accounts state, activeAccountId, initStore, all actions updated |
| 8 | `app/_layout.tsx` | MODIFY — new modal routes, init flow |
| 9 | `app/index.tsx` | MODIFY — header account tap, remove placeholder state |
| 10 | `app/accounts-modal.tsx` | **NEW** — search + select accounts, delete, "+" button |
| 11 | `app/create-account-modal.tsx` | **NEW** — name, icon picker, opening balance, first-time mode |

## Key Notes

- **No "All Accounts" view** — always require an active account. If none exist, force CreateAccountModal.
- **Opening balance** is a regular transaction with `notes: 'Saldo Awal'` and `time: '00:00'`.
- **Account deletion** is hard delete with cascade (deletes all account's transactions).
- **Transaction deletion** remains soft delete (existing `deleted_at` pattern).
- **First-time mode** (`?mode=first-time`) hides cancel/back button in CreateAccountModal.
- **Migration**: if `accounts` table doesn't exist → drop `transactions` table, recreate both, seed fresh data.
- **Storage**: uses SQLite `settings` table for key-value storage (activeAccountId). No AsyncStorage — avoids native module rebuild.
- **EAS Build**: dev APK built with EAS Build (15 builds/month limit for Android). Avoid adding native modules that require rebuilds.