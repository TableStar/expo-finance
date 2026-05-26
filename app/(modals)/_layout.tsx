import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ presentation: 'modal', headerShown: false }}>
      <Stack.Screen
        name="accounts-modal"
        options={{
          presentation: 'modal',
          animation: 'fade_from_bottom',
        }}
      />
      <Stack.Screen
        name="create-account-modal"
        options={{
          presentation: 'modal',
          animation: 'fade_from_bottom',
        }}
      />
    </Stack>
  );
}
