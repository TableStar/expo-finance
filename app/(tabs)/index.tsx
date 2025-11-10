import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/nativewindui/Text';

export default function Screen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text variant="largeTitle">Welcome to Weather App</Text>
      <Text variant="body" className="mt-4 text-center">
        Your weather app is ready to be built!
      </Text>
    </View>
  );
}
