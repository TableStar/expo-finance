import ModalScreen from '@/components/ModalScreen';
import { formatYMD } from '@/lib/date';
import { addTransaction } from '@/lib/db/transactions';
import { useTransactions } from '@/store/store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

type FormState = {
  name: string;
  icon: 'wallet' | 'bank' | 'cellphone';
  balanceType: 'in' | 'out';
  balanceAmount: string;
  balanceDate: string;
};

const ICONS = [
  { name: 'wallet', label: 'Cash', icon: 'wallet' },
  { name: 'bank', label: 'Bank', icon: 'bank' },
  { name: 'cellphone', label: 'E-Wallet', icon: 'cellphone' },
] as const;

export default function CreateAccountModal() {
  const { addAccount, setActiveAccount } = useTransactions();
  const params = useLocalSearchParams();

  const isFirstTime = params.mode === 'first-time';

  const [form, setForm] = useState<FormState>({
    name: '',
    icon: 'wallet',
    balanceType: 'in',
    balanceAmount: '',
    balanceDate: formatYMD(new Date()),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  async function handleSubmit() {
    if (form.name.trim() === '') {
      Alert.alert('Error', 'Account name is required');
      return;
    }

    const accountId = await addAccount({ name: form.name.trim(), icon: form.icon });

    const amount = parseFloat(form.balanceAmount);

    if (amount > 0) {
      await addTransaction({
        account_id: accountId,
        type: form.balanceType,
        amount,
        notes: 'Saldo Awal',
        date: form.balanceDate,
        time: '00:00',
      });
    }
    await setActiveAccount(accountId);

    if (isFirstTime) {
      router.replace('/');
    } else {
      router.back();
    }
  }

  return (
    <ModalScreen>
      <ScrollView className="px-4">
        <View className="flex-row items-center justify-between  py-3">
          <Text className="text-lg font-bold text-foreground">Create New Account</Text>
          {!isFirstTime && (
            <TouchableOpacity onPress={router.back} className="self-end py-4">
              <Ionicons name="close" size={24} color="gray" />
            </TouchableOpacity>
          )}
        </View>
        <Text className="text-base font-semibold text-foreground">Account Name</Text>
        <TextInput
          className="rounded-lg bg-muted px-4 py-3 text-foreground"
          value={form.name}
          onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
          placeholder="e.g. My Wallet"
          placeholderTextColor="gray"
        />

        <Text className="mt-4 text-base font-semibold text-foreground">Choose Icon</Text>
        <View className="flex-row gap-4 py-2">
          {ICONS.map((item) => (
            <TouchableOpacity
              key={item.name}
              onPress={() => setForm((prev) => ({ ...prev, icon: item.name }))}
              className="items-center">
              <MaterialCommunityIcons
                name={item.icon}
                size={40}
                color={form.icon === item.name ? '#901E3E' : '#888'}
              />
              <Text
                className={
                  form.icon === item.name ? 'font-medium text-[#901E3E]' : 'text-muted-foreground'
                }>
                {item.label}
              </Text>
              {form.icon === item.name && <View className="h-0.5 w-full bg-[#901E3E]" />}
            </TouchableOpacity>
          ))}
        </View>
        <Text className="mt-4 text-base font-semibold text-foreground">Opening Balancer</Text>
        <View className="flex-row gap-2 py-2">
          <TouchableOpacity
            onPress={() => setForm((prev) => ({ ...prev, balanceType: 'in' }))}
            className={
              form.balanceType === 'in'
                ? 'flex-1 rounded-lg bg-green-500 py-2'
                : 'flex-1 rounded-lg bg-muted py-2'
            }>
            <Text
              className={
                form.balanceType === 'in'
                  ? 'text-center font-semibold text-white'
                  : 'text-center text-foreground'
              }>
              + (Positive)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setForm((prev) => ({ ...prev, balanceType: 'out' }))}
            className={
              form.balanceType === 'out'
                ? 'flex-1 rounded-lg bg-red-500 py-2'
                : 'flex-1 rounded-lg bg-muted py-2'
            }>
            <Text
              className={
                form.balanceType === 'out'
                  ? 'text-center font-semibold text-white'
                  : 'text-center text-foreground'
              }>
              - (Negative / Owed)
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          className="rounded-lg bg-muted px-4 py-3 text-xl text-foreground"
          value={form.balanceAmount}
          onChangeText={(text) => setForm((prev) => ({ ...prev, balanceAmount: text }))}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="gray"
        />
        <Text className="mt-4 text-base font-semibold text-foreground">Date</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="rounded-lg bg-muted px-4 py-3">
          <Text className="text-foreground">{form.balanceDate}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(form.balanceDate)}
            mode="date"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setForm((prev) => ({ ...prev, balanceDate: formatYMD(date) }));
            }}
          />
        )}
        <TouchableOpacity onPress={handleSubmit} className="mt-6 rounded-xl bg-[#901E3E] py-3">
          <Text className="text-center text-lg font-bold text-white">Create Account</Text>
        </TouchableOpacity>
        <View className="h-8" />
      </ScrollView>
    </ModalScreen>
  );
}
