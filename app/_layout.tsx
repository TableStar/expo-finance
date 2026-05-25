import '@/global.css';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeToggle } from '@/components/nativewindui/ThemeToggle';
import { useColorScheme } from '@/lib/useColorScheme';
import { NAV_THEME } from '@/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SQLiteProvider } from 'expo-sqlite';
import { initDb } from '@/lib/db/schema';
import { useEffect } from 'react';
import { initStore, useTransactions } from '@/store/store';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// const isIos26 = Platform.select({ default: false, ios: Device.osVersion?.startsWith('26.') });

const queryClient = new QueryClient();

export default function RootLayout() {
  const { colorScheme, isDarkColorScheme } = useColorScheme();

  useEffect(() => {
    initStore().then(() => {
      const get = useTransactions.getState();
      const accounts = get.accounts;
      const activeAccountId = get.activeAccountId;
      if (accounts.length === 0 || activeAccountId === null) {
        // I'll replace '/' with the true path after creacte-account-modal has been made
        router.replace('/create-account-modal?mode=first-time');
      }
    });
  }, []);

  return (
    <>
      <StatusBar
        key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
        style={isDarkColorScheme ? 'light' : 'dark'}
      />
      {/* WRAP YOUR APP WITH ANY ADDITIONAL PROVIDERS HERE */}
      {/* <ExampleProvider> */}
      <SQLiteProvider databaseName="finance.db" onInit={initDb}>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ActionSheetProvider>
              <NavThemeProvider value={NAV_THEME[colorScheme]}>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  {/* <Stack.Screen name="index" options={INDEX_OPTIONS} /> */}
                  <Stack.Screen name="modal" options={MODAL_OPTIONS} />
                  <Stack.Screen
                    name="accounts-modal"
                    options={{
                      presentation: 'modal',
                      animation: 'fade_from_bottom',
                      title: 'Accounts',
                    }}
                  />
                  <Stack.Screen
                    name="create-account-modal"
                    options={{
                      presentation: 'modal',
                      animation: 'fade_from_bottom',
                      title: 'New Accounts',
                    }}
                  />
                </Stack>
              </NavThemeProvider>
            </ActionSheetProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </SQLiteProvider>
      {/* </ExampleProvider> */}
    </>
  );
}

// const INDEX_OPTIONS = {
//   headerLargeTitle: true,
//   headerTransparent: isIos26,
//   title: 'NativewindUI',
//   headerRight: () => <SettingsIcon />,
// } as const;

// function SettingsIcon() {
//   return (
//     <Link href="/modal" asChild>
//       <Pressable className={cn('opacity-80 active:opacity-50', isIos26 && 'px-1.5')}>
//         <Icon name="gearshape" className="text-foreground" />
//       </Pressable>
//     </Link>
//   );
// }

const MODAL_OPTIONS = {
  presentation: 'modal',
  animation: 'fade_from_bottom', // for android
  title: 'Settings',
  headerRight: () => <ThemeToggle />,
} as const;
