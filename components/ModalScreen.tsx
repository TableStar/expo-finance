import { SafeAreaView } from 'react-native-safe-area-context';

export default function ModalScreen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {children}
    </SafeAreaView>
  );
}