import { Link, Tabs } from 'expo-router';
import { Platform, Pressable } from 'react-native';
import * as Device from 'expo-device';
import { Icon } from '@/components/nativewindui/Icon';
import { cn } from '@/lib/cn';

const isIos26 = Platform.select({ default: false, ios: Device.osVersion?.startsWith('26.') });

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={INDEX_OPTIONS} />
    </Tabs>
  );
}

const INDEX_OPTIONS = {
  headerLargeTitle: false,
  headerTransparent: isIos26,
  title: 'Home',
  headerRight: () => <SettingsIcon />,
} as const;

function SettingsIcon() {
  return (
    <Link href="/modal" asChild>
      <Pressable className={cn('opacity-80 active:opacity-50', isIos26 && 'px-1.5')}>
        <Icon name="gearshape" className="text-foreground" />
      </Pressable>
    </Link>
  );
}
