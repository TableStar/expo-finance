import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const FILTERS = ['All', 'Daily', 'Weekly', 'Monthly', 'Yearly'] as const;

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('All');
  const insets = useSafeAreaInsets();
  const [currAccount, setCurrAccount] = useState('Account_Name');
  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}>
      <View className="flex-row items-center justify-between bg-orange-600 px-4 py-3">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity>
            <Ionicons name="menu" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-xl font-bold text-white">{currAccount}</Text>
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
        className="flex-grow-0 border-b border-border bg-orange-600 py-2 "
        contentContainerClassName="px-4">
        {FILTERS.map((filter) => {
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
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
      <ScrollView className="flex-1 px-4 pt-2">
        <Text className="mt-10 text-center text-muted-foreground">Transaction here</Text>
      </ScrollView>
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
          <Text className="font-bold  text-green-500">Rp 1.500.000</Text>
        </View>
        <View>
          <Text className="text-sm  text-red-700">Total Expense</Text>
          <Text className="font-bold  text-red-700">Rp 1.500.000</Text>
        </View>
        <View>
          <Text className="text-sm text-muted-foreground">Balance</Text>
          <Text className="font-bold text-foreground">Rp 1.500.000</Text>
        </View>
      </View>
    </View>
  );
}
