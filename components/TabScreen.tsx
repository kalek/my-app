import cx from 'clsx';
import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabScreenProps = PropsWithChildren<{
  className?: string;
}>;

/**
 * Applies safe area via context insets instead of NativeSafeAreaView per screen,
 * avoiding the one-frame under-status-bar flash when switching tabs.
 */
export function TabScreen({ children, className }: TabScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cx('bg-background flex-1', className)}
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View className="flex-1 p-5">{children}</View>
    </View>
  );
}
