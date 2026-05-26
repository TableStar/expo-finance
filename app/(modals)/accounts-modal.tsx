import ModalScreen from '@/components/ModalScreen';
import { countTransactionByAcct } from '@/lib/db/transactions';
import { useTransactions } from '@/store/store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AccountsModal() {
  //its fine to be single destructure like this in here as there is few changes that need rerender
  const { accounts, activeAccountId, setActiveAccount, deleteAccount } = useTransactions();

  const [search, setSearch] = useState<string>('');

  const filtered = accounts.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  async function handleSelectAccount(id: number) {
    await setActiveAccount(id);
    router.back();
  }
  function handleAddAccount() {
    router.push('/create-account-modal');
  }

  async function handleDeleteAccount(id: number) {
    const acct = accounts.find((a) => a.id === id);
    const count = await countTransactionByAcct(id);
    Alert.alert('Delete Account?', `this will permanently delete ${count} transactions.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteAccount(id);
        },
      },
    ]);
  }

  return (
    <ModalScreen >
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <Text className="text-lg font-bold text-foreground">Accounts</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="gray" />
        </TouchableOpacity>
      </View>

      <View className="px-4 py-2">
        <TextInput
          className="rounded-lg bg-muted px-4 py-2 text-foreground"
          placeholder="Search accounts..."
          placeholderTextColor="gray"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView className="flex-1">
        {filtered.map((account) => (
          <Pressable
            key={account.id}
            onPress={() => handleSelectAccount(account.id)}
            onLongPress={() => handleDeleteAccount(account.id)}
            className="flex-row items-center justify-between px-4 py-3 active:bg-muted">
            <View className="flex-row items-center gap-3">
              <MaterialCommunityIcons name={account.icon} size={24} color={account.color} />
              <Text className="text-base text-foreground">{account.name}</Text>
            </View>
            {account.id === activeAccountId && (
              <Ionicons name="checkmark" size={20} color="#22c55e" />
            )}
          </Pressable>
        ))}

        {filtered.length === 0 && (
          <View className="px-4 py-8">
            <Text className="text-center text-muted-foreground">No accounts found</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        onPress={handleAddAccount}
        className="flex-row items-center justify-center gap-2 border-t border-border px-4 py-4">
        <Ionicons name="add-circle-outline" size={24} color="#901E3E" />
        <Text className="text-base font-semibold text-[#901E3E]">Add Account</Text>
      </TouchableOpacity>
    </ModalScreen>
  );
}
