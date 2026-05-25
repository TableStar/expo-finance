import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useTransactions } from '@/store/store';
import { TransactionsList } from '@/components/TransactionsList';
import { FILTERS, FilterType } from '@/types/types';
import { getDateRange } from '@/lib/date';
import { router } from 'expo-router';

export default function Home() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [periodeOffset, setPeriodeOffset] = useState(0);
  const { transactions, setFilters, previousBalance } = useTransactions();

  const accounts = useTransactions((s) => s.accounts);
  const activeAccountId = useTransactions((s) => s.activeAccountId);

  const currAccount = accounts.find((acc) => acc.id === activeAccountId);

  useEffect(() => {
    if (activeFilter === 'All') {
      setFilters({});
      return;
    }
    const { startDate, endDate } = getDateRange(activeFilter, periodeOffset);
    setFilters({ startDate, endDate });
  }, [activeFilter, periodeOffset]);

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setPeriodeOffset(0);
  };

  const dateRange = useMemo(() => {
    if (activeFilter === 'All') return null;
    return getDateRange(activeFilter, periodeOffset);
  }, [activeFilter, periodeOffset]);

  const { income, expense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tr of transactions) {
      if (tr.type === 'in') income += tr.amount;
      else expense += tr.amount;
    }
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const frmt = (n: number) =>
    `Rp ${n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}>
      <View className="flex-row items-center justify-between bg-[#901E3E] px-4 py-3">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity>
            <Ionicons name="menu" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.push('/accounts-modal')}>
            <MaterialCommunityIcons name={currAccount?.icon ?? 'wallet'} size={20} color="white" />
            <Text className="text-xl font-bold text-white">{currAccount?.name ?? '  '}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity>
            <Ionicons name="document-text" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity>
            <MaterialIcons name="more-vert" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-grow-0 border-b border-border bg-[#901E3E] py-2 "
        contentContainerClassName="px-4">
        {FILTERS.map((filter) => {
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => handleFilterChange(filter)}
              className={`rounded-xl px-3 py-2 ${activeFilter === filter ? 'bg-white' : 'bg-transparent'}`}>
              <Text
                className={`font-medium ${
                  activeFilter === filter ? 'text-black-foreground' : 'text-white'
                }`}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {dateRange && (
        <View className="flex-row items-center justify-between gap-4 border-b border-border bg-card px-4 py-2">
          <TouchableOpacity onPress={() => setPeriodeOffset((o) => o - 1)}>
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-foreground">{dateRange.label}</Text>
          <TouchableOpacity onPress={() => setPeriodeOffset((o) => o + 1)}>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
      {activeFilter !== 'All' && previousBalance !== null && (
        <View className="flex-row items-center gap-2 px-4 py-2">
          <Text className="text-sm text-muted-foreground">Previous Balance</Text>
          <Text className="font-bold text-foreground">{frmt(previousBalance)}</Text>
        </View>
      )}
      <View className="flex-1 pt-1">
        <TransactionsList transactions={transactions} />
      </View>
      <View className=" flex-row items-center justify-around gap-3 px-4 py-2">
        <TouchableOpacity className="flex-1 rounded-xl bg-green-400 px-4 py-2">
          <Text className="text-center text-xl font-semibold text-white">Income</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 rounded-xl bg-red-600 px-4 py-2">
          <Text className="text-center text-xl font-semibold text-white">Expense</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center justify-evenly gap-2 border-t border-border bg-card px-4 pb-3 pt-2">
        <View>
          <Text className="text-sm text-green-500">Total Income</Text>
          <Text className="font-bold text-green-500">{frmt(income)}</Text>
        </View>
        <View>
          <Text className="text-sm text-red-700">Total Expense</Text>
          <Text className="font-bold text-red-700">{frmt(expense)}</Text>
        </View>
        <View>
          <Text className="text-sm text-muted-foreground">Balance</Text>
          <Text className="font-bold text-foreground">{frmt(balance)}</Text>
        </View>
      </View>
      {activeFilter !== 'All' && previousBalance !== null && (
        <View className="flex-col border-t border-border bg-card px-4 py-2">
          <View className="flex-row items-center justify-end gap-2">
            <Text className="text-sm text-muted-foreground">Previous Balance</Text>
            <Text className="font-bold text-foreground">{frmt(previousBalance)}</Text>
          </View>
          <View className="flex-row items-center justify-end gap-2">
            <Text className="text-sm text-muted-foreground">Ending Balance</Text>
            <Text className="font-bold text-foreground">{frmt(previousBalance + balance)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
