import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

export default function RootLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <View className="bg-background flex-1" />;
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
